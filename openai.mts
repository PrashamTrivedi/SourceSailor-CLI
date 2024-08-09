import OpenAI from 'openai'
import {get_encoding} from "tiktoken"
import {Stream} from "openai/streaming"
import {prompts} from "./prompts.mjs"
import {readConfig} from "./utils.mjs"
import {ChatCompletion} from "openai/resources/index.mjs"
import {ChatCompletionChunk} from "openai/src/resources/index.js"
import {ChatCompletionCreateParamsBase, ChatCompletionMessageParam, ChatCompletionTool} from "openai/resources/chat/completions.mjs"

interface ModelLimit {
    name: string
    limit: number
    
}
interface Function {
    name: string
    parameters: Record<string, any>
    description: string
}

interface Tool {
    type: string
    function: Function
}

export interface LlmInterface {
    inferProjectDirectory(projectDirectory: string, useOpenAi?: boolean, isStreaming?: boolean, isVerbose?: boolean): Promise<string | undefined>
    inferDependency(dependencyFile: string, workflow: string, useOpenAi?: boolean, isStreaming?: boolean, isVerbose?: boolean): Promise<string | undefined | Stream<ChatCompletionChunk>>
    inferCode(code: string, useOpenAi?: boolean, isStreaming?: boolean, isVerbose?: boolean): Promise<string | undefined | Stream<ChatCompletionChunk>>
    inferInterestingCode(code: string, useOpenAi?: boolean, isStreaming?: boolean, isVerbose?: boolean): Promise<string | undefined | Stream<ChatCompletionChunk>>
    generateReadme(directoryStructure: string, dependencyInference: string, codeInference: string, useOpenAi?: boolean, isStreaming?: boolean, isVerbose?: boolean): Promise<string | undefined | Stream<ChatCompletionChunk>>
    generateMonorepoReadme(monorepoInferrenceInfo: string, useOpenAi?: boolean, isStreaming?: boolean, isVerbose?: boolean): Promise<string | undefined | Stream<ChatCompletionChunk>>
    listModels(isVerbose?: boolean): Promise<string[]>
}

export class OpenAIInferrence implements LlmInterface {
    private modelLimits: ModelLimit[] = [
        {name: 'gpt-4', limit: 8000},
        {name: 'gpt-4-32k', limit: 32000},
        {name: 'gpt-4-0125-preview', limit: 128000},
        {name: 'gpt-4-turbo', limit: 128000},
        {name: 'gpt-4o', limit: 128000},
        {name: 'gpt-4o-mini', limit: 128000},
        {name: 'gpt-4-1106-preview', limit: 128000},
        {name: 'gpt-4-turbo-preview', limit: 128000},
        {name: 'gpt-3.5-turbo', limit: 4000},
        {name: 'gpt-3.5-turbo-16k', limit: 16000}
    ]

    private async calculateTokens(messages: ChatCompletionMessageParam[]): Promise<number> {
        const chatMessages = messages.filter(message => message.content?.length ?? 0 > 0).map(message => message.content)
        const enc = await get_encoding("cl100k_base")
        const tokens = enc.encode(chatMessages.join('\n'))
        return tokens.length
    }

    private createPrompt(systemPrompt: string, userPrompt: string, isVerbose: boolean): ChatCompletionMessageParam[] {
        const compatibilityMessage: ChatCompletionMessageParam[] = [{
            role: "system",
            content: systemPrompt
        }, {
            role: "user",
            content: userPrompt
        }]
        if (isVerbose) {
            console.log(`System Prompt: ${systemPrompt}`)
            console.log(`User Prompt: ${userPrompt}`)
        }
        return compatibilityMessage
    }

    private async calculateTokensAndCheckLimit(
        compatibilityMessage: ChatCompletionMessageParam[],
        model: string,
        isVerbose: boolean
    ): Promise<void> {
        const tokens = await this.calculateTokens(compatibilityMessage)
        const modelLimit = this.modelLimits.find(modelLimit => modelLimit.name === model)
        const modelLimitTokens = modelLimit?.limit ?? 0
        if (isVerbose) {
            console.log(`Model limit: ${modelLimitTokens}, Tokens: ${tokens}`)
        }
        if (modelLimitTokens < tokens) {
            throw new Error(`Prompt is Too Long. It has ${tokens} tokens, but the limit is ${modelLimit?.limit}`)
        }
    }

    private async callApiAndReturnResult(
        openai: OpenAI,
        model: string,
        compatibilityMessage: ChatCompletionMessageParam[],
        isStreaming: boolean,
        isVerbose: boolean,
        tools?: ChatCompletionTool[]
    ): Promise<string | undefined | Stream<ChatCompletionChunk>> {
        const apiParams: ChatCompletionCreateParamsBase = {
            model,
            messages: compatibilityMessage,
            temperature: 0,
            stream: isStreaming
        }
        if (tools) {
            apiParams.tools = tools
            apiParams.tool_choice = {type: "function", function: {name: tools[0].function.name}}
            delete apiParams.stream
            isStreaming = false
        }
        if (isVerbose) {
            console.log(JSON.stringify(apiParams, null, 2))
        }
        const matchJson = await openai.chat.completions.create(apiParams)
        if (isVerbose && !isStreaming) {
            console.log(JSON.stringify((matchJson as ChatCompletion).choices[0], null, 2))
        }
        if (isStreaming) {
            // @ts-expect-erro Exclude streaming from coverage
            return matchJson as Stream<ChatCompletionChunk>
        } else {
            const completionData = matchJson as ChatCompletion
            if (completionData.choices.length === 0) {
                throw new Error('Invalid response from OpenAI')
            }
            if (completionData.choices[0].finish_reason === 'tool_calls' || (completionData.choices[0].message?.tool_calls?.length ?? 0 > 0)) {
                const response = completionData.choices[0].message?.tool_calls?.flatMap(toolCall => toolCall?.function?.arguments)
                return response?.join('')
            } else {
                return completionData.choices[0].message.content || undefined
            }
        }
    }

    private async getModel(useOpenAi: boolean): Promise<string> {
        const openai = this.getOpenAiClient(useOpenAi)
        const config = readConfig()

        if (useOpenAi) {
            const models = await openai.models.list()
            const gpt4 = models.data.find(model => model.id === config.DEFAULT_OPENAI_MODEL ?? process.env.DEFAULT_OPENAI_MODEL ?? 'gpt-4-preview')
            if (gpt4) {
                return gpt4.id
            } else {
                return models.data.find(model => model.id === 'gpt-3.5-turbo')?.id ?? 'gpt-3.5-turbo'
            }
        } else {
            return Promise.resolve(process.env.OPTIONAL_MODEL ?? "meta-llama/llama-2-13b-chat")
        }
    }

    private getOpenAiClient(useOpenAi: boolean): OpenAI {
        const config = readConfig()

        if (!useOpenAi) {
            return new OpenAI({
                apiKey: process.env.OPENROUTER_API_KEY,
                baseURL: process.env.OPENROUTER_API_URL,
                timeout: 60000,
            })
        }
        return new OpenAI({apiKey: config.OPENAI_API_KEY || process.env.OPENAI_API_KEY, timeout: 60000})
    }

    public async inferProjectDirectory(
        projectDirectory: string,
        useOpenAi: boolean = true,
        isStreaming: boolean = false,
        isVerbose: boolean = false
    ): Promise<string | undefined> {
        const openai = this.getOpenAiClient(useOpenAi)
        const model = await this.getModel(useOpenAi)

        const compatibilityMessage = this.createPrompt(
            `${prompts.commonSystemPrompt.prompt}\n${prompts.rootUnderstanding.prompt}`,
            `<FileStructure>${JSON.stringify(projectDirectory)}</FileStructure>`,
            isVerbose
        )

        await this.calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose)
        const tools: ChatCompletionTool[] = []

        if (prompts.rootUnderstanding.params) {
            tools.push(
                {
                    type: "function",
                    function: {
                        name: prompts.rootUnderstanding.params.name,
                        parameters: prompts.rootUnderstanding.params.parameters,
                        description: prompts.rootUnderstanding.params.description
                    }
                }
            )
        }
        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose, tools) as Promise<string | undefined>
    }

    public async inferDependency(
        dependencyFile: string,
        workflow: string,
        useOpenAi: boolean = true,
        isStreaming: boolean = false,
        isVerbose: boolean = false
    ): Promise<string | undefined | Stream<ChatCompletionChunk>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(useOpenAi, isVerbose)
        const model = await this.getModel(useOpenAi)
        const compatibilityMessage = this.createPrompt(
            `${prompts.commonSystemPrompt.prompt}\n${prompts.dependencyUnderstanding.prompt}`,
            `<DependencyFile>${JSON.stringify(dependencyFile)}</DependencyFile>\n<Workflow>${workflow}</Workflow>`,
            isVerbose
        )

        await this.calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose)

        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async inferCode(
        code: string,
        useOpenAi: boolean = true,
        isStreaming: boolean = false,
        isVerbose: boolean = false
    ): Promise<string | undefined | Stream<ChatCompletionChunk>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(useOpenAi, isVerbose)
        const model = await this.getModel(useOpenAi)
        const compatibilityMessage = this.createPrompt(
            `${prompts.commonSystemPrompt.prompt}\n${prompts.codeUnderstanding.prompt}`,
            `<Code>${JSON.stringify(code)}</Code>`,
            isVerbose
        )
        await this.calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose)

        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async inferInterestingCode(
        code: string,
        useOpenAi: boolean = true,
        isStreaming: boolean = false,
        isVerbose: boolean = false
    ): Promise<string | undefined | Stream<ChatCompletionChunk>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(useOpenAi, isVerbose)
        const model = await this.getModel(useOpenAi)
        const compatibilityMessage = this.createPrompt(
            prompts.interestingCodeParts.prompt,
            `<Code>${JSON.stringify(code)}</Code>`,
            isVerbose
        )
        await this.calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose)
        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async generateReadme(
        directoryStructure: string,
        dependencyInference: string,
        codeInference: string,
        useOpenAi: boolean = true,
        isStreaming: boolean = false,
        isVerbose: boolean = false
    ): Promise<string | undefined | Stream<ChatCompletionChunk>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(useOpenAi, isVerbose)
        const model = await this.getModel(useOpenAi)
        const compatibilityMessage = this.createPrompt(
            prompts.readmePrompt.prompt,
            `<DirectoryStructure>${JSON.stringify(directoryStructure)}</DirectoryStructure>\n<DependencyInferrence>${JSON.stringify(dependencyInference)}</DependencyInferrence>\n<CodeInferrence>${JSON.stringify(codeInference)}</CodeInferrence>`,
            isVerbose
        )
        await this.calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose)

        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async generateMonorepoReadme(
        monorepoInferrenceInfo: string,
        useOpenAi: boolean = true,
        isStreaming: boolean = false,
        isVerbose: boolean = false
    ): Promise<string | undefined | Stream<ChatCompletionChunk>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(useOpenAi, isVerbose)
        const model = await this.getModel(useOpenAi)
        const compatibilityMessage = this.createPrompt(
            prompts.consolidatedInferrenceForMonoRepo.prompt,
            `<MonoRepoInferrence>${JSON.stringify(monorepoInferrenceInfo)}</MonoRepoInferrence>`,
            isVerbose
        )
        await this.calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose)

        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async listModels(isVerbose: boolean = false): Promise<string[]> {
        const openai = this.getOpenAiClient(true)
        const models = await openai.models.list()

        if (isVerbose) {
            console.log(models.data)
        }

        return models.data.sort((a, b) => b.created - a.created).flatMap(model => model.id)
    }
}

export default OpenAIInferrence
