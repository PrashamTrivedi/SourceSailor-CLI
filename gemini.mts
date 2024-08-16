import {LlmInterface} from "./llmInterface.mjs"
import {Stream} from "openai/streaming.mjs"
import {ChatCompletionChunk} from "openai/resources/index.mjs"
import {GoogleGenerativeAI, GenerativeModel} from "@google/generative-ai"
import {readConfig} from "./utils.mjs"
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
    private modelLimits: {name: string; limit: number}[] = [];

    private getGeminiClient(): GoogleGenerativeAI {
        const config = readConfig()
        return new GoogleGenerativeAI(config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "")
    }

    private async getModel(): Promise<GenerativeModel> {
        const genAI = this.getGeminiClient()
        const config = readConfig()
        return genAI.getGenerativeModel({model: config.DEFAULT_GEMINI_MODEL || process.env.DEFAULT_GEMINI_MODEL || "gemini-pro"})
    }

    private createPrompt(systemPrompt: string, userPrompt: string, isVerbose: boolean, userExpertise?: string): string {
        let finalPrompt = systemPrompt
        if (userExpertise) {
            finalPrompt += `\n<Expertise>${JSON.stringify(userExpertise)}</Expertise>`
        }
        finalPrompt += `\n\n${userPrompt}`

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

    async inferProjectDirectory(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string): Promise<string | undefined> {
        const model = await this.getModel()
        const prompt = this.createPrompt(
            "Analyze the following project directory structure:",
            `<FileStructure>${directoryStructure}</FileStructure>`,
            isVerbose,
            userExpertise
        )

        const result = await model.generateContent(prompt)
        return result.response.text()
    }

    async inferDependency(dependencyFile: string, workflow: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel()
        const prompt = this.createPrompt(
            "Analyze the following dependency file and workflow:",
            `<DependencyFile>${dependencyFile}</DependencyFile>\n<Workflow>${workflow}</Workflow>`,
            isVerbose,
            userExpertise
        )

        const result = await model.generateContent(prompt)
        return result.response.text()
    }

    async inferCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel()
        const prompt = this.createPrompt(
            "Analyze the following code structure:",
            `<Code>${directoryStructure}</Code>`,
            isVerbose,
            userExpertise
        )

        const result = await model.generateContent(prompt)
        return result.response.text()
    }

    async inferInterestingCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel()
        const prompt = this.createPrompt(
            "Identify interesting parts in the following code structure:",
            `<Code>${directoryStructure}</Code>`,
            isVerbose,
            userExpertise
        )

        const result = await model.generateContent(prompt)
        return result.response.text()
    }

    async generateReadme(directoryStructure: string, dependencyInference: string, codeInference: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string): Promise<string | Stream<ChatCompletionChunk>> {
        const model = await this.getModel()
        const prompt = this.createPrompt(
            "Generate a README based on the following project information:",
            `<DirectoryStructure>${directoryStructure}</DirectoryStructure>\n<DependencyInference>${dependencyInference}</DependencyInference>\n<CodeInference>${codeInference}</CodeInference>`,
            isVerbose,
            userExpertise
        )

        const result = await model.generateContent(prompt)
        return result.response.text()
    }
}

export default GeminiInference
