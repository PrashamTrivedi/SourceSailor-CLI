import { Arguments, Argv } from "yargs"
import OpenAIInferrence, { LlmInterface } from "../openai.mjs"

export const command = 'listModels [verbose]'

export const describe = 'List all available OpenAI models'

export function builder(yargs: Argv) {
    return yargs.option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Show detailed model information',
        default: false
    })
}

export async function handler(argv: Arguments) {
    console.log(`List all available OpenAI models`)
    const openai = new OpenAIInferrence()
    const llmInterface: LlmInterface = openai
    try {
        const models = await llmInterface.listModels(argv.verbose as boolean)
        console.log(models)
    } catch (error) {
        console.error('Error listing models:', error)
    }
}
