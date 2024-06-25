import {Arguments, Argv} from "yargs"

import OpenAIInferrence, {LlmInterface} from "../openai.mjs"
export const command = 'listModels [verbose]'

export const describe = 'List all available OpenAI models'

export function builder(yargs: Argv) {
    return yargs
}

export async function handler(argv: Arguments) {
    console.log(`List all available OpenAI models`)
    const openai = new OpenAIInferrence()
    const llmInterface: LlmInterface = openai
    const models = await llmInterface.listModels(argv.verbose as boolean || argv.v as boolean || false)
    console.log(models)
}