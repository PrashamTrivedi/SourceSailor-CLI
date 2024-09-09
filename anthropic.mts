import Anthropic from "@anthropic-ai/sdk"
import {LlmInterface} from "./llmInterface.mjs"
import {readConfig} from "./utils.mjs"
import {Message, MessageCreateParams, RawMessageStreamEvent, Tool} from "@anthropic-ai/sdk/resources/messages.mjs"
import {Stream} from "@anthropic-ai/sdk/streaming.mjs"
import {prompts} from "./prompts.mjs"

type modelType = keyof typeof modelMapping

const modelMapping = {
    "claude-3-haiku": 'claude-3-haiku-20240307',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3.5-sonnet': 'claude-3-5-sonnet-20240620',
    'haiku-3': 'claude-3-haiku-20240307',
    'sonnet-3': 'claude-3-sonnet-20240229',
    'opus-3': 'claude-3-opus-20240229',
    'sonnet-3.5': 'claude-3-5-sonnet-20240620',
}

export class AnthropicInterface implements LlmInterface {
    private getModelId(model: modelType): string {
        return modelMapping[model]
    }

    private getClient() {
        const config = readConfig()
        return new Anthropic({
            apiKey: config.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
        })
    }

    getName(): string {
        return "Anthropic"
    }

    async listModels(verbose: boolean): Promise<string[]> {
        if (verbose) {
            console.log(modelMapping)
        }
        return Object.keys(modelMapping)
    }

    async inferProjectDirectory(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined> {
        const model = this.getModel(modelName)
        const systemPrompt = `${prompts.commonSystemPrompt.prompt}\n${prompts.rootUnderstanding.prompt}`
        const userPrompt = `<FileStructure>${JSON.stringify(directoryStructure)}</FileStructure>`

        const tools: Tool | undefined = prompts.rootUnderstanding.params ? {
            name: prompts.rootUnderstanding.params.name,
            input_schema: {
                type: "object",
                properties: {
                    isMonorepo: {type: "boolean", description: prompts.rootUnderstanding.params.parameters.properties['isMonorepo'].description},
                    directories: {
                        type: "array",
                        items: {type: "string"},
                        description: prompts.rootUnderstanding.params.parameters.properties['directories'].description
                    },
                    programmingLanguage: {
                        type: "string",
                        description: prompts.rootUnderstanding.params.parameters.properties['programmingLanguage'].description
                    },
                    framework: {
                        type: "string",
                        description: prompts.rootUnderstanding.params.parameters.properties['framework'].description,
                    },
                    dependenciesFile: {
                        type: "string",
                        description: prompts.rootUnderstanding.params.parameters.properties['dependenciesFile'].description
                    },
                    lockFile: {
                        type: "string",
                        description: prompts.rootUnderstanding.params.parameters.properties['lockFile'].description
                    },
                    entryPointFile: {
                        type: "string",
                        description: prompts.rootUnderstanding.params.parameters.properties['entryPointFile'].description
                    },
                    workflow: {
                        type: "string",
                        description: prompts.rootUnderstanding.params.parameters.properties['workflow'].description
                    },
                },
            },
            description: prompts.rootUnderstanding.params.description,

        } : undefined

        return this.callApiAndReturnString(model, systemPrompt, userPrompt, tools, allowStreaming) as Promise<string | undefined>
    }

    async inferDependency(dependencyFile: string, workflow: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>> {
        const model = this.getModel(modelName)
        const systemPrompt = `${prompts.commonSystemPrompt.prompt}\n${prompts.dependencyUnderstanding.prompt}`
        const userPrompt = `<DependencyFile>${JSON.stringify(dependencyFile)}</DependencyFile>\n<Workflow>${workflow}</Workflow> ${prompts.commonMarkdownPrompt.prompt}`

        return this.callApiAndReturnString(model, systemPrompt, userPrompt, undefined, allowStreaming)
    }

    async inferCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>> {
        const model = this.getModel(modelName)
        const systemPrompt = `${prompts.commonSystemPrompt.prompt}\n${prompts.codeUnderstanding.prompt}`
        const userPrompt = `<Code>${JSON.stringify(directoryStructure)}</Code> ${prompts.commonMarkdownPrompt.prompt}`

        return this.callApiAndReturnString(model, systemPrompt, userPrompt, undefined, allowStreaming)
    }

    async inferInterestingCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>> {
        const model = this.getModel(modelName)
        const systemPrompt = prompts.interestingCodeParts.prompt
        const userPrompt = `<Code>${JSON.stringify(directoryStructure)}</Code> ${prompts.commonMarkdownPrompt.prompt}`

        return this.callApiAndReturnString(model, systemPrompt, userPrompt, undefined, allowStreaming)
    }

    async generateReadme(directoryStructure: string, dependencyInference: string, codeInference: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>> {
        const model = this.getModel(modelName)
        const systemPrompt = prompts.readmePrompt.prompt
        const userPrompt = `<DirectoryStructure>${JSON.stringify(directoryStructure)}</DirectoryStructure>\n<DependencyInference>${JSON.stringify(dependencyInference)}</DependencyInference>\n<CodeInference>${JSON.stringify(codeInference)}</CodeInference> ${prompts.commonMarkdownPrompt.prompt}`

        return this.callApiAndReturnString(model, systemPrompt, userPrompt, undefined, allowStreaming)
    }

    private getModel(modelName?: string): string {
        const config = readConfig()
        const selectedModel = modelName || config.DEFAULT_ANTHROPIC_MODEL || process.env.DEFAULT_ANTHROPIC_MODEL || "claude-3-opus-20240229"
        return this.getModelId(selectedModel as modelType)
    }

    private async callApiAndReturnString(modelId: string, systemPrompt: string,
        userPrompt: string, tools?: Tool, allowStreaming: boolean = false): Promise<string | AsyncIterable<string>> {
        const client = this.getClient()
        const messageConfig: MessageCreateParams = {
            max_tokens: 8192,
            model: modelId,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            stream: allowStreaming
        }
        if (tools) {
            messageConfig.tools = [tools]
            messageConfig.tool_choice = {type: 'tool', name: tools.name}
            delete messageConfig.stream
            allowStreaming = false
        }
        const response = await client.messages.create(messageConfig)
        if (allowStreaming) {
            const stream = response as Stream<RawMessageStreamEvent>
            return this.convertStreamToStringStream(stream)
        } else {
            const message = response as Message
            if()
            if (message.stop_reason === 'tool_use') {
                const toolContent = message.content.find(contentData => contentData.type === 'tool_use')
                if (toolContent) {
                    return JSON.parse(toolContent.input as string)
                }
            }
            return message.content.filter(content => content.type === 'text').map(content => content.text).join("\n")
        }
    }

    private async * convertStreamToStringStream(response: Stream<RawMessageStreamEvent>): AsyncIterable<string> {
        for await (const chunk of response) {
            if (chunk.type === 'content_block_delta') {
                if (chunk.delta.type === 'text_delta') {
                    yield chunk.delta.text
                }
            }
        }
    }
}

export default AnthropicInterface
