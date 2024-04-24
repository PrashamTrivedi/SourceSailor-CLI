import fs from 'fs'
import path from 'path'
import {getAnalysis, readConfig} from '../utils.mjs'
import {generateReadme} from '../openai.mjs'
import ora from "ora"

export const command = 'prepareReport <path|p> [verbose|v] [streaming|s]'

export const describe = 'Prepare a report based on the analysis'


export function builder(yargs) {
    yargs.positional('path', {
        alias: 'p',
        describe: 'Path to the analysis',
        type: 'string',
    })
    yargs.option('verbose', {
        alias: 'v',
        describe: 'Verbose output',
        type: 'boolean',
    })
    yargs.option('streaming', {
        alias: 's',
        describe: 'Stream the output to a file',
        type: 'boolean',
    })

    return yargs
}

export async function handler(argv) {
    const isVerbose = argv.verbose || argv.v || false
    const useOpenAi = true
    const allowStreaming = argv.streaming || argv.s || false
    const projectDir = argv.path || argv.p
    const config = readConfig()

    const rootDir = config.ANALYSIS_DIR

    const isProjectRoot = rootDir === 'p'
    const dirPath = isProjectRoot ? projectDir : path.join(rootDir, '.SourceSailor', projectDir)
    if (isVerbose) {
        console.log({dirPath, isProjectRoot})
    }

    const spinner = ora('Preparing report').start()

    const analysis = getAnalysis(dirPath, isProjectRoot)
    if (isVerbose) {
        console.log({analysis: Object.keys(analysis)})
    }
    if (!analysis) {
        spinner.fail('No analysis found, Please run analyse command first')
        return
    }
    const directoryStructure = analysis.directoryStructure
    const dependencyInference = analysis.dependencyInference
    const codeInference = analysis.codeInferrence

    if (isVerbose) {
        console.log({directoryStructure, dependencyInference, codeInference})
    }
    const report = await generateReadme(directoryStructure, dependencyInference, codeInference, true, allowStreaming, isVerbose)

    let readmeResponse = ""
    if (allowStreaming) {
        spinner.stop().clear()
        for await (const chunk of report) {
            const message = chunk.choices[0]?.delta.content || ""
            process.stdout.write(message)
            readmeResponse += message
        }
        process.stdout.write("\n")

    } else {
        spinner.stopAndPersist({symbol: '✔️', text: report})

        readmeResponse = report
    }
}
export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']