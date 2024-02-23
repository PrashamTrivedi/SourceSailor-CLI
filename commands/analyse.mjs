import {getDirStructure} from "../directoryProcessor.mjs"
import {inferProjectDirectory} from "../openai.mjs"

export const command = 'analyse <path|p> [verbose|v] [openai|o] [streaming|s]'

export const describe = 'Analyse the given directory structure to understand the project structure and dependencies'

export function builder(yargs) {

    yargs.positional('path', {
        describe: 'Path to the directory to analyse',
        type: 'string',
    })
    yargs.positional('p', {
        describe: 'Path to the directory to analyse',
        type: 'string',
    })
    yargs.option('verbose', {
        alias: 'v',
        describe: 'Run with verbose logging',
        type: 'boolean',
        default: false
    })
    yargs.option('openai', {
        alias: 'o',
        describe: 'Use OpenAI to infer project structure',
        type: 'boolean',
        default: true
    })
    yargs.option('streaming', {
        alias: 's',
        describe: 'Use OpenAI streaming to infer project structure',
        type: 'boolean',
        default: false
    })

    return yargs
}

export async function handler(argv) {
    const isVerbose = argv.verbose || argv.v || false
    const useOpenAi = argv.openai || argv.o || true
    const allowStreaming = false
    if (isVerbose) {
        console.log(`Analyse the given directory structure to understand the project structure and dependencies: ${argv.path}`)
    }
    const directoryStructure = await getDirStructure(argv.path, isVerbose)
    const directoryInferrenceResponse = await inferProjectDirectory(directoryStructure, useOpenAi, allowStreaming, isVerbose)
    const directoryInferrence = JSON.parse(directoryInferrenceResponse ?? "")
    // const message =
    console.log(directoryInferrence)

}
export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']