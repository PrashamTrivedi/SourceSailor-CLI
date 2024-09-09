import OpenAI from 'openai'
import {Stream} from "openai/streaming"
import {prompts} from "./prompts.mjs"
import {readConfig} from "./utils.mjs"
import {ChatCompletion} from "openai/resources/index.mjs"
import {ChatCompletionChunk} from "openai/src/resources/index.js"
import {ChatCompletionCreateParamsBase, ChatCompletionMessageParam, ChatCompletionTool} from "openai/resources/chat/completions.mjs"
import {LlmInterface} from "./llmInterface.mjs"

interface ModelLimit {
    name: string
    limit: number

}

// interface Tool {
//     type: string
//     function: Function
// }



export class OpenAIInferrence implements LlmInterface {
    getName(): string {
        return 'OpenAI'
    }
    private modelLimits: ModelLimit[] = [
        {name: 'gpt-4', limit: 8000},
        {name: 'gpt-4-32k', limit: 32000},
        {name: 'gpt-4-0125-preview', limit: 128000},
        {name: 'gpt-4-turbo', limit: 128000},
        {name: 'gpt-4o', limit: 128000},
        {name: 'gpt-4o-mini', limit: 128000},
        {name: 'chatgpt-4o-latest', limit: 128000},
        {name: 'gpt-4o-2024-08-06', limit: 128000},
        {name: 'gpt-4-1106-preview', limit: 128000},
        {name: 'gpt-4-turbo-preview', limit: 128000},
        {name: 'gpt-3.5-turbo', limit: 4000},
        {name: 'gpt-3.5-turbo-16k', limit: 16000}
    ]


    private createPrompt(systemPrompt: string, userPrompt: string, isVerbose: boolean, userExpertise?: string): ChatCompletionMessageParam[] {
        let finalSystemPrompt = systemPrompt
        if (userExpertise) {
            finalSystemPrompt += `\n<Expertise>${JSON.stringify(userExpertise)}</Expertise>`
        }
        const compatibilityMessage: ChatCompletionMessageParam[] = [{
            role: "system",
            content: finalSystemPrompt
        }, {
            role: "user",
            content: userPrompt
        }]
        if (isVerbose) {
            console.log(`System Prompt: ${finalSystemPrompt}`)
            console.log(`User Prompt: ${userPrompt}`)
        }
        return compatibilityMessage
    }

    private async callApiAndReturnResult(
        openai: OpenAI,
        model: string,
        compatibilityMessage: ChatCompletionMessageParam[],
        isStreaming: boolean,
        isVerbose: boolean,
        tools?: ChatCompletionTool[]
    ): Promise<string | undefined | AsyncIterable<string>> {
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
            const matchJsonStream = matchJson as Stream<ChatCompletionChunk>


            return this.convertStreamToStringStream(matchJsonStream)
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

    private async getModel(modelName?: string): Promise<string> {
        const config = readConfig()
        const defaultModel = config.DEFAULT_OPENAI_MODEL || process.env.DEFAULT_OPENAI_MODEL || 'gpt-4-preview'
        return modelName || defaultModel
    }

    private getOpenAiClient(): OpenAI {
        const config = readConfig()

        return new OpenAI({apiKey: config.OPENAI_API_KEY || process.env.OPENAI_API_KEY, timeout: 60000})
    }

    public async inferProjectDirectory(
        projectDirectory: string,
        isStreaming: boolean = false,
        isVerbose: boolean = false,
        userExpertise?: string,
        modelName?: string
    ): Promise<string | undefined> {
        const openai = this.getOpenAiClient()
        const model = await this.getModel(modelName)

        const compatibilityMessage = this.createPrompt(
            `${prompts.commonSystemPrompt.prompt}\n${prompts.rootUnderstanding.prompt}`,
            `<FileStructure>${JSON.stringify(projectDirectory)}</FileStructure>`,
            isVerbose,
            userExpertise
        )


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
        isStreaming: boolean = false,
        isVerbose: boolean = false,
        userExpertise?: string,
        modelName?: string
    ): Promise<string | undefined | AsyncIterable<string>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(isVerbose)
        const model = await this.getModel(modelName)
        const compatibilityMessage = this.createPrompt(
            `${prompts.commonSystemPrompt.prompt}\n${prompts.dependencyUnderstanding.prompt}`,
            `<DependencyFile>${JSON.stringify(dependencyFile)}</DependencyFile>\n<Workflow>${workflow}</Workflow> ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )



        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async inferCode(
        code: string,
        isStreaming: boolean = false,
        isVerbose: boolean = false,
        userExpertise?: string,
        modelName?: string
    ): Promise<string | undefined | AsyncIterable<string>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(isVerbose)
        const model = await this.getModel(modelName)
        const compatibilityMessage = this.createPrompt(
            `${prompts.commonSystemPrompt.prompt}\n${prompts.codeUnderstanding.prompt}`,
            `<Code>${JSON.stringify(code)}</Code> ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )


        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async inferInterestingCode(
        code: string,
        isStreaming: boolean = false,
        isVerbose: boolean = false,
        userExpertise?: string,
        modelName?: string
    ): Promise<string | undefined | AsyncIterable<string>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(isVerbose)
        const model = await this.getModel(modelName)
        const compatibilityMessage = this.createPrompt(
            prompts.interestingCodeParts.prompt,
            `<Code>${JSON.stringify(code)}</Code>  ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )

        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async generateReadme(
        directoryStructure: string,
        dependencyInference: string,
        codeInference: string,
        isStreaming: boolean = false,
        isVerbose: boolean = false,
        userExpertise?: string,
        modelName?: string
    ): Promise<string | undefined | AsyncIterable<string>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(isVerbose)
        const model = await this.getModel(modelName)
        const compatibilityMessage = this.createPrompt(
            prompts.readmePrompt.prompt,
            `<DirectoryStructure>${JSON.stringify(directoryStructure)}</DirectoryStructure>\n<DependencyInferrence>${JSON.stringify(dependencyInference)}</DependencyInferrence>\n<CodeInferrence>${JSON.stringify(codeInference)}</CodeInferrence>  ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )


        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async generateMonorepoReadme(
        monorepoInferrenceInfo: string,
        isStreaming: boolean = false,
        isVerbose: boolean = false,
        userExpertise?: string,
        modelName?: string
    ): Promise<string | undefined | AsyncIterable<string>> {
        // @ts-expect-error Exclude streaming from coverage
        const openai = this.getOpenAiClient(isVerbose)
        const model = await this.getModel(modelName)
        const compatibilityMessage = this.createPrompt(
            prompts.consolidatedInferrenceForMonoRepo.prompt,
            `<MonoRepoInferrence>${JSON.stringify(monorepoInferrenceInfo)}</MonoRepoInferrence>  ${prompts.commonMarkdownPrompt.prompt}`,
            isVerbose,
            userExpertise
        )


        return this.callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
    }

    public async listModels(isVerbose: boolean = false): Promise<string[]> {
        const openai = this.getOpenAiClient()
        const models = await openai.models.list()

        if (isVerbose) {
            console.log(models.data)
        }

        return models.data.sort((a, b) => b.created - a.created).flatMap(model => model.id)
    }

    private async *convertStreamToStringStream(response: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>): AsyncIterable<string> {
        for await (const chunk of response) {
            yield chunk.choices[0]?.delta.content || ""
        }


    }

}


export default OpenAIInferrence
