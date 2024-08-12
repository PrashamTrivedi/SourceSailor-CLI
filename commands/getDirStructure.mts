import chalk from "chalk"
import {readConfig} from "../utils.mjs"
import {getDirStructure, FileNode} from "../directoryProcessor.mjs"
import { handler as getExpertiseHandler } from './getExpertise.mts';
import inquirer from 'inquirer';

export const command = 'dirStructure <path|p> [verbose|v] [withContent|c]  [ignore|i]'

export const describe = 'Get Directory Structure'

import {Argv} from 'yargs'

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

import {Arguments} from 'yargs'

export async function handler(argv: Arguments) {
    const isVerbose = argv.verbose as boolean || argv.v as boolean || false
    const ignore = argv.ignore as string[] || argv.i as string[] || []
    const withContent = argv.withContent as boolean || argv.c as boolean || false
    if (isVerbose) {
        console.log({argv})
    }
    const projectName = argv.path as string

    if (isVerbose) {
        console.log(`Project Name: ${projectName}`)
    }

    if (!projectName) {
        console.error('Error: Project path is required')
        return
    }

    const homeDir = os.homedir()
    const configFile = path.join(homeDir, '.SourceSailor', 'config.json')
    let configData: Record<string, any> = {}

    if (fs.existsSync(configFile)) {
        const configFileData = fs.readFileSync(configFile, 'utf8')
        try {
            configData = JSON.parse(configFileData)
        } catch (error) {
            console.error('Error parsing config file:', error)
        }
    }

    if (!configData.expertise) {
        const { setExpertise } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'setExpertise',
                message: 'Your expertise level is not set. Would you like to set it now?',
                default: true,
            },
        ]);

        if (setExpertise) {
            await getExpertiseHandler(argv);
        } else {
            console.log('You can set your expertise level later using the setExpertise command.');
        }
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

            function deleteContent(file: FileNode) {
                delete file.content
                if (file.children) {
                    for (const child of file.children) {
                        deleteContent(child)
                    }
                }
            }

            for (const file of directoryStructure.children) {
                deleteContent(file)
            }
            console.log(JSON.stringify(directoryStructure))
        }
    } catch (error) {
        console.error('Error analyzing directory structure:', error)
    }
}

export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']
