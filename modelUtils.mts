import {LlmInterface} from "./llmInterface.mjs"
import OpenAIInferrence from "./openai.mjs"
import GeminiInference from "./gemini.mjs"
import AnthropicInterface from "./anthropic.mjs"
import {readConfig} from "./utils.mjs"

class ModelUtils {
    private static instance: ModelUtils
    private modelCache: Map<string, LlmInterface> = new Map();
    private modelList: string[] = [];
    private modelProviders: Map<string, string[]> = new Map();

    private constructor() { }

    public static getInstance(): ModelUtils {
        if (!ModelUtils.instance) {
            ModelUtils.instance = new ModelUtils()
        }
        return ModelUtils.instance
    }

    public async initializeModels(): Promise<void> {
        const openai = new OpenAIInferrence()
        const gemini = new GeminiInference()
        const anthropic = new AnthropicInterface()

        const openaiModels = await openai.listModels(false)
        const geminiModels = await gemini.listModels(false)
        const anthropicModels = await anthropic.listModels(false)

        this.modelList = [...openaiModels, ...geminiModels, ...anthropicModels]
        this.modelProviders.set('OpenAI', openaiModels)
        this.modelProviders.set('Gemini', geminiModels)
        this.modelProviders.set('Anthropic', anthropicModels)

        for (const model of openaiModels) {
            this.modelCache.set(model, openai)
        }

        for (const model of geminiModels) {
            this.modelCache.set(model, gemini)
        }

        for (const model of anthropicModels) {
            this.modelCache.set(model, anthropic)
        }
    }

    public getLlmInterface(modelName?: string): LlmInterface {
        const config = readConfig()
        const defaultModel = config.DEFAULT_OPENAI_MODEL || "gpt-3.5-turbo"

        const determinedModelName = modelName || defaultModel
        

        const llmInterface = this.modelCache.get(determinedModelName)

        if (!llmInterface) {
            throw new Error(`Model ${determinedModelName} not found. Available models: ${this.modelList.join(", ")}`)
        } 

        return llmInterface
    }

    public getAvailableModels(): string[] {
        return this.modelList
    }

    public getModelsByProvider(): Record<string, string[]> {
        return Object.fromEntries(this.modelProviders)
    }
}

export default ModelUtils
