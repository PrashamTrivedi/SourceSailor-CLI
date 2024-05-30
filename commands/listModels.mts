import {listModels} from "../openai.mjs"

export const command = 'listModels [verbose]'

export const describe = 'List all available OpenAI models'

export function builder(yargs: any) {
    return yargs
}

export async function handler(argv: {verbose: boolean, v: boolean}) {
    console.log(`List all available OpenAI models`)
    const models = await listModels(argv.verbose || argv.v || false)
    console.log(models)
}