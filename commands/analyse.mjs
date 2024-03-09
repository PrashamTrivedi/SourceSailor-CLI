import {getDirStructure} from "../directoryProcessor.mjs"
import {inferDependency, inferProjectDirectory} from "../openai.mjs"
import {parseTree} from "../treeParser.mjs"
import fs from 'fs'
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
    const projectName = argv.path

    if (isVerbose) {
        console.log({project: argv.path, directoryInferrence})
    }



    console.log(`Analysing ${projectName}'s file structure to getting started.`)

    const directories = []
    if (!directoryInferrence.isMonorepo) {
        const depenencyFile = fs.readFileSync(`${argv.path}/${directoryInferrence.dependenciesFile}`, 'utf-8')
        const dependencyInferrence = await inferDependency(depenencyFile, directoryInferrence.workflow, useOpenAi, allowStreaming, isVerbose)
        if (allowStreaming) {
            for await (const chunk of dependencyInferrence) {
                console.log(chunk)
            }
        } else {
            console.log(dependencyInferrence)
        }
        const tree = await parseTree(`${argv.path}/${directoryInferrence.entryPointFile}`, directoryInferrence.treeSitterLanguage, isVerbose)
        console.log(tree)
    } else {
        directories.push(...directoryInferrence.directories)
    }





}
export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']