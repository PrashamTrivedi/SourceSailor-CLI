import path from 'path'
import {getAnalysis, readConfig, writeAnalysis} from '../utils.mjs'
import ModelUtils from "../modelUtils.mjs"
import {LlmInterface} from "../llmInterface.mjs"
import ora from "ora"
import {ChatCompletionChunk} from "openai/resources/index.mjs"
import {Stream} from "openai/streaming.mjs"
import chalk from "chalk"
import {confirm} from '@inquirer/prompts'
import {handler as setExpertiseHandler} from './setExpertise.mjs'

export const command = 'prepareReport <path|p> [verbose|v] [streaming|s]'

export const describe = 'Prepare a report based on the analysis'


import {Argv} from 'yargs'

export function builder(yargs: Argv) {
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
    yargs.option('model', {
        alias: 'm',
        describe: 'Specify the AI model to use for report generation',
        type: 'string'
    })

    return yargs
}

import {Arguments} from 'yargs'

export async function handler(argv: Arguments) {
    const isVerbose = argv.verbose as boolean || argv.v as boolean || false
    const allowStreaming = argv.streaming as boolean || argv.s as boolean || false
    const projectDir = argv.path as string || argv.p as string
    const modelName = argv.model as string || argv.m as string
    const config = readConfig()
    const modelUtils = ModelUtils.getInstance()
    await modelUtils.initializeModels()
    const llmInterface: LlmInterface = modelUtils.getLlmInterface(modelName || config.DEFAULT_OPENAI_MODEL)
    const rootDir = config.ANALYSIS_DIR
    const selectedModelName = modelName || config.DEFAULT_OPENAI_MODEL
    const userExpertise = JSON.stringify(config.userExpertise)
    
    if (isVerbose) {
        console.log(`Using model: ${selectedModelName}`)
    }

    // Handle current directory case
    const isCurrentDir = projectDir === '.'
    const projectName = isCurrentDir ? process.cwd().split('/').pop() ?? "" : projectDir

    const isProjectRoot = rootDir === 'p'
    const dirPath = isProjectRoot 
        ? projectDir 
        : path.join(rootDir, '.SourceSailor', projectName)

    if (isVerbose) {
        console.log({dirPath, isProjectRoot, projectDir})
    }

    const spinner = ora('Preparing report').start()

    const analysis = getAnalysis(dirPath, isProjectRoot)
    if (isVerbose) {
        console.log({analysis: Object.keys(analysis)})
    }
    if (!analysis || Object.keys(analysis).length === 0) {
        spinner.fail('No analysis found, Please run analyse command first')
        return
    }
    const directoryStructure = analysis.directoryStructure
    const dependencyInference = analysis.dependencyInference
    const codeInference = analysis.codeInferrence

    if (isVerbose) {
        console.log({directoryStructure, dependencyInference, codeInference})
    }
    const report = await llmInterface.generateReadme(directoryStructure, dependencyInference, codeInference, allowStreaming, isVerbose, userExpertise, selectedModelName)

    if (report) {

        let readmeResponse = ""
        if (allowStreaming) {
            spinner.stop().clear()
            for await (const chunk of report as AsyncIterable<string>) {

                process.stdout.write(chunk)
                readmeResponse += chunk
            }

            process.stdout.write("\n")

        } else {
            const reportAsText = report as string
            spinner.stopAndPersist({symbol: '✔️', text: reportAsText})

            readmeResponse = reportAsText
        }
        writeAnalysis(dirPath, "inferredReadme", readmeResponse, isProjectRoot)
    }

    if (!config.userExpertise) {
        console.log(chalk.yellow("User expertise is not set. Setting your expertise level will help us provide more tailored reports."))
        const setExpertise = await confirm({message: "Would you like to set your expertise now?", default: true})
        if (setExpertise) {
            await setExpertiseHandler()
        }
    }
}
export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']
