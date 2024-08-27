import {LlmInterface} from "./llmInterface.mjs"
import {Stream} from "openai/streaming.mjs"
import {ChatCompletionChunk} from "openai/resources/index.mjs"
import {GoogleGenerativeAI, GenerativeModel, SchemaType} from "@google/generative-ai"
import {readConfig} from "./utils.mjs"
import {prompts} from "./prompts.mjs"
import axios from 'axios'

interface ModelInfo {
    name: string
    baseModelId: string
    version: string
    displayName: string
    description: string
    inputTokenLimit: number
    outputTokenLimit: number
    supportedGenerationMethods: string[]
    temperature: number
    topP: number
    topK: number
}

export class GeminiInference implements LlmInterface {

    getName(): string {
        return "Gemini"
    }
    private modelLimits: {name: string; limit: number}[] = [];

    private getGeminiClient(): GoogleGenerativeAI {
        const config = readConfig()
        return new GoogleGenerativeAI(config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "")
    }

    private async getModel(modelName?: string, systemPrompt?: string): Promise<GenerativeModel> {
        const genAI = this.getGeminiClient()
        const config = readConfig()
        const selectedModel = modelName || config.DEFAULT_GEMINI_MODEL || process.env.DEFAULT_GEMINI_MODEL || "gemini-pro"

        try {
            const model = genAI.getGenerativeModel({
                model: selectedModel,
                generationConfig: {
                    maxOutputTokens: 8192,
                },
            })
            if (systemPrompt) {
                model.systemInstruction = {
                    role: "system", parts: [{
                        text: systemPrompt
                    }]
                }
            }
            if (this.modelLimits.length === 0) {
                await this.listModels(false)  // Populate modelLimits if not already done
            }
            const modelLimit = this.modelLimits.find(m => m.name === selectedModel)?.limit
            if (modelLimit) {
                model.generationConfig = {...model.generationConfig, maxOutputTokens: modelLimit}
            }

            return model
        } catch (error) {
            throw new Error(`Model ${selectedModel} not found or not available. Please choose a valid Gemini model.`)
        }
    }

    private createPrompt(userPrompt: string, isVerbose: boolean, userExpertise?: string): string {
        let finalPrompt = userPrompt
        if (userExpertise) {
            finalPrompt = `<Expertise>${JSON.stringify(userExpertise)}</Expertise>\n\n${finalPrompt}`
        }

        if (isVerbose) {
            console.log(`Full Prompt: ${finalPrompt}`)
        }
        return finalPrompt
    }

    async listModels(verbose: boolean): Promise<string[]> {
        const config = readConfig()
        const apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY
        if (!apiKey) {
            throw new Error("Gemini API key is not set")
        }

        try {
            const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1000`)
            const models: ModelInfo[] = response.data.models

            this.modelLimits = models.map(model => ({
                name: model.name.replace("models/", ""),
                limit: model.inputTokenLimit
            }))

            if (verbose) {
                console.log({models: JSON.stringify(models)})
            }
            return this.modelLimits.map(model => model.name)
        } catch (error) {
            console.error("Error fetching Gemini models:", error)
            throw error
        }
    }

    async inferProjectDirectory(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined> {
        const model = await this.getModel(modelName, `${prompts.commonSystemPrompt.prompt}\n${prompts.rootUnderstanding.prompt}`)

        if (prompts.rootUnderstanding.params) {
            model.generationConfig = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {

                        isMonorepo: {
                            type: SchemaType.BOOLEAN,
                            description: prompts.rootUnderstanding.params.parameters.properties['isMonorepo'].description
                        },
                        directories: {
                            type: SchemaType.ARRAY,
                            items: {type: SchemaType.STRING},
                            description: prompts.rootUnderstanding.params.parameters.properties['directories'].description
                        },
                        programmingLanguage: {
                            type: SchemaType.STRING,
                            description: prompts.rootUnderstanding.params.parameters.properties['programmingLanguage'].description
                        },
                        framework: {
                            type: SchemaType.STRING,
                            description: prompts.rootUnderstanding.params.parameters.properties['framework'].description
                        },
                        dependenciesFile: {
                            type: SchemaType.STRING,
                            description: prompts.rootUnderstanding.params.parameters.properties['dependenciesFile'].description
                        },
                        lockFile: {
                            type: SchemaType.STRING,
                            description: prompts.rootUnderstanding.params.parameters.properties['lockFile'].description
                        },
                        entryPointFile: {
                            type: SchemaType.STRING,
                            description: prompts.rootUnderstanding.params.parameters.properties['entryPointFile'].description
                        },
                        workflow: {
                            type: SchemaType.STRING,
                            description: prompts.rootUnderstanding.params.parameters.properties['workflow'].description
                        },
                    },
                    required: prompts.rootUnderstanding.params.parameters.properties.required
                }
            }
        }
        if (isVerbose) {
            console.log(`Model generation config: ${JSON.stringify(model)}`)
        }

        const prompt = this.createPrompt(
            `<FileStructure>${directoryStructure}</FileStructure>`,
            isVerbose,
            userExpertise
        )

        const result = await model.generateContent({
            contents: [{role: "user", parts: [{text: prompt}]}]
        })

        const responseText = result.response.text()
        if (isVerbose) {
            console.log("Gemini response:", responseText)
        }

        return responseText
    }

    async inferDependency(dependencyFile: string, workflow: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel(modelName, `${prompts.commonSystemPrompt.prompt}\n${prompts.dependencyUnderstanding.prompt}`)
        const prompt = this.createPrompt(
            `<DependencyFile>${dependencyFile}</DependencyFile>\n<Workflow>${workflow}</Workflow> ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )
        if (isVerbose) {
            console.log(`Model generation config: ${JSON.stringify(model)}`)
        }


        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        if (isVerbose) {
            console.log("Gemini response:", responseText)
        }

        return responseText
    }

    async inferCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel(modelName, `${prompts.commonSystemPrompt.prompt}\n${prompts.codeUnderstanding.prompt}`)
        const prompt = this.createPrompt(
            `<Code>${directoryStructure}</Code> ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )
        if (isVerbose) {
            console.log(`Model generation config: ${JSON.stringify(model)}`)
        }


        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        if (isVerbose) {
            console.log("Gemini response:", responseText)
        }

        return responseText
    }

    async inferInterestingCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel(modelName, prompts.interestingCodeParts.prompt)
        const prompt = this.createPrompt(
            `<Code>${directoryStructure}</Code> ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )
        if (isVerbose) {
            console.log(`Model generation config: ${JSON.stringify(model)}`)
        }


        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        if (isVerbose) {
            console.log("Gemini response:", responseText)
        }

        return responseText
    }

    async generateReadme(directoryStructure: string, dependencyInference: string, codeInference: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel(modelName, prompts.readmePrompt.prompt)
        const prompt = this.createPrompt(
            `<DirectoryStructure>${directoryStructure}</DirectoryStructure>\n<DependencyInference>${dependencyInference}</DependencyInference>\n<CodeInference>${codeInference}</CodeInference> ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )
        if (isVerbose) {
            console.log(`Model generation config: ${JSON.stringify(model)}`)
        }


        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        if (isVerbose) {
            console.log("Gemini response:", responseText)
        }

        return responseText
    }
}

export default GeminiInference
