import chalk from "chalk"
import {getDirStructure, FileNode} from "../directoryProcessor.mjs"
import {Argv} from 'yargs'
import {Arguments} from 'yargs'
import {readConfig} from "../utils.mjs"
import {confirm} from '@inquirer/prompts'
import {handler as setExpertiseHandler} from './setExpertise.mjs'

export const command = 'dirStructure <path|p> [verbose|v] [withContent|c]  [ignore|i]'

export const describe = 'Get Directory Structure'



export function builder(yargs: Argv) {
    yargs.positional('path', {
        alias: 'p',

        describe: 'Path to the directory to analyse',
        type: 'string',
    })

    yargs.option('verbose', {
        alias: 'v',
        describe: 'Run with verbose logging',
        type: 'boolean',
        default: false
    })

    yargs.option('withContent', {
        alias: 'c',
        describe: 'Include content of files in the analysis',
        type: 'boolean',
        default: true,
    })


    yargs.option('ignore', {
        alias: 'i',
        describe: 'Specify files or directories to ignore during analysis',
        type: 'array',
        default: []
    })
    return yargs
}


export async function handler(argv: Arguments) {
    const isVerbose = argv.verbose as boolean || argv.v as boolean || false
    const ignore = argv.ignore as string[] || argv.i as string[] || []
    const withContent = argv.withContent as boolean || argv.c as boolean || false
    if (isVerbose) {
        console.log({argv})
    }
    const projectName = argv.path as string

    const config = readConfig()

    if (isVerbose) {
        console.log(`Project Name: ${projectName}`)
    }

    if (!projectName) {
        console.error('Error: Project path is required')
        return
    }

    console.log(`Analysing ${chalk.redBright(projectName)}'s file structure to getting started.`)
    // const defaultSpinner = ora().start()
    const path = argv.path as string

    try {
        const directoryStructureWithContent = await getDirStructure(path, ignore, isVerbose)

        if (withContent) {
            console.log(JSON.stringify(directoryStructureWithContent))
        } else {
            const directoryStructure = JSON.parse(JSON.stringify(directoryStructureWithContent))

            for (const file of directoryStructure.children) {
                deleteContent(file)
            }



            for (const file of directoryStructure.children) {
                deleteContent(file)
            }
            console.log(JSON.stringify(directoryStructure))
        }
    } catch (error) {
        console.error('Error analyzing directory structure:', error)
    }

    if (!config.userExpertise) {
        console.log(chalk.yellow("User expertise is not set. Setting your expertise level will help us provide more tailored analysis."))
        const setExpertise = await confirm({message: "Would you like to set your expertise now?", default: true})
        if (setExpertise) {
            await setExpertiseHandler()
        }
    }
}

function deleteContent(file: FileNode) {
    delete file.content
    if (file.children) {
        for (const child of file.children) {
            deleteContent(child)
        }
    }
}

export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']

