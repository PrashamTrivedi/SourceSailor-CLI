
export interface LlmInterface {
    getName(): string
    listModels(verbose: boolean): Promise<string[]>
    inferProjectDirectory(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined>
    inferDependency(dependencyFile: string, workflow: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>>
    inferCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>>
    inferInterestingCode(directoryStructure: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>>
    generateReadme(directoryStructure: string, dependencyInference: string, codeInference: string, allowStreaming: boolean, isVerbose: boolean, userExpertise?: string, modelName?: string): Promise<string | undefined | AsyncIterable<string>>
}
