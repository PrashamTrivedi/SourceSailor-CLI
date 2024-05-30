import chalk from "chalk"
import {readConfig} from "../utils.mjs"
import {getDirStructure} from "../directoryProcessor.mjs"
import {getTreeSitterFromFileName, UnknownLanguageError} from "../treeSitterFromFieNames.mjs"
import {analyseFileContents} from "../treeParser.mjs"


export const command = 'dirStructure <path|p> [verbose|v] [withContent|c] [withTreeStructure|t] [ignore|i]'

export const describe = 'Get Directory Structure'

export function builder(yargs) {
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

    yargs.option('withTreeStructure', {
        alias: 't',
        describe: 'Include tree structure of files in the analysis',
        type: 'boolean',
        default: false,
    })

    yargs.option('ignore', {
        alias: 'i',
        describe: 'Specify files or directories to ignore during analysis',
        type: 'array',
        default: []
    })
    return yargs
}

export async function handler(argv) {
    const isVerbose = argv.verbose || argv.v || false
    const withTreeStructure = argv.withTreeStructure || argv.t || false
    const ignore = argv.ignore || argv.i || []


    const withContent = argv.withContent || argv.c || false
    if (isVerbose) {
        console.log({argv})
    }


    if (withContent && withTreeStructure) {
        console.error('Cannot include both content and tree structure in the analysis')
        process.exit(1)
    }
    const projectName = argv.path

    console.log(`Analysing ${chalk.redBright(projectName)}'s file structure to getting started.`)
    // const defaultSpinner = ora().start()
    const path = argv.path
    const directoryStructureWithContent = await getDirStructure(path, ignore, isVerbose)

    if (withContent) {
        console.log(JSON.stringify(directoryStructureWithContent))
    } else if (withTreeStructure) {
        await traverseAndAnalyze(isVerbose, directoryStructureWithContent)
        console.log(JSON.stringify(directoryStructureWithContent))

    } else {
        const directoryStructure = JSON.parse(JSON.stringify(directoryStructureWithContent))

        function deleteContent(file) {
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
}
async function traverseAndAnalyze(isVerbose, node) {
    if (node.content !== null) {
        try {
            const language = getTreeSitterFromFileName(node.name)
            if (isVerbose) {
                console.log(`Language for ${node.name}: ${language}`)
            }
            node.content = await analyseFileContents(language, isVerbose, node.content)
        } catch (error) {
            if (error instanceof UnknownLanguageError) {
                console.warn(`Skipping analysis for ${node.name}: ${error.message}`)
            } else {
                console.error(`Error analysing ${node.name}`, error)
            }
        }
    }

    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            await traverseAndAnalyze(isVerbose, child)
        }
    }
}
export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']
