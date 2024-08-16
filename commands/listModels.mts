import { Arguments, Argv } from "yargs"
import ModelUtils from "../modelUtils.mjs"
import chalk from "chalk"

export const command = 'listModels [verbose]'

export const describe = 'List all available models grouped by provider'

export function builder(yargs: Argv) {
    return yargs.option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Show detailed model information',
        default: false
    })
}

export async function handler(argv: Arguments) {
    console.log(chalk.blue('Listing all available models grouped by provider:'))
    const modelUtils = ModelUtils.getInstance()
    await modelUtils.initializeModels()

    try {
        const modelsByProvider = modelUtils.getModelsByProvider()

        for (const [provider, models] of Object.entries(modelsByProvider)) {
            console.log(chalk.green(`\n${provider}:`))
            models.forEach(model => {
                console.log(chalk.yellow(`  - ${model}`))
            })
        }
    } catch (error) {
        console.error(chalk.red('Error listing models:'), error)
    }
}

export const usage = '$0 <cmd> [args]'

export const aliases = ['models', 'lm']
