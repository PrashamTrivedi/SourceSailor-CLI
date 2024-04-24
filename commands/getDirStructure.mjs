import chalk from "chalk"
import {readConfig} from "../utils.mjs"
import {getDirStructure} from "../directoryProcessor.mjs"

export const command = 'dirStructure <path|p> [verbose|v] [withContent|c] [ignore|i]'

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
        default: true
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
    const ignore = argv.ignore || argv.i || []
    const withContent = argv.withContent || argv.c || false
    if (isVerbose) {
        console.log({argv})
    }
    const projectName = argv.path


    console.log(`Analysing ${chalk.redBright(projectName)}'s file structure to getting started.`)
    // const defaultSpinner = ora().start()
    const path = argv.path
    const directoryStructureWithContent = await getDirStructure(path, ignore, isVerbose)

    if (!withContent) {

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
    } else {

        console.log(JSON.stringify(directoryStructureWithContent))
    }

}
export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']