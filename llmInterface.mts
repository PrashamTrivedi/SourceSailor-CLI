import {Stream} from "openai/streaming.mjs"
import {ChatCompletionChunk} from "openai/resources/index.mjs"

export interface LlmInterface {
    getName(): string
    listModels(verbose: boolean): Promise<string[]>
    inferProjectDirectory(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined>
    inferDependency(dependencyFile: string, workflow: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | Stream<ChatCompletionChunk>>
    inferCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | Stream<ChatCompletionChunk>>
    inferInterestingCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | Stream<ChatCompletionChunk>>
    generateReadme(directoryStructure: string, dependencyInference: string, codeInference: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | Stream<ChatCompletionChunk>>
}
