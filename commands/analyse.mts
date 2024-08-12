/* eslint-disable @typescript-eslint/no-explicit-any */
import {FileNode, getDirStructure} from "../directoryProcessor.mjs"
import OpenAIInferrence, {LlmInterface} from "../openai.mjs"
import fs from 'fs'
import {addAnalysisInGitIgnore, readConfig, writeAnalysis, writeError} from "../utils.mjs"
import ora from 'ora'
import {Arguments} from 'yargs'
import {ChatCompletionChunk} from "openai/resources/index.mjs"
import {Stream} from "openai/streaming.mjs"
import chalk from "chalk"
import {confirm} from '@inquirer/prompts'
import {handler as setExpertiseHandler} from './setExpertise.mjs'



// Export these functions for testing
export {
    analyseDirectoryStructure,
    inferDependenciesAndWriteAnalysis,
    getDirectoryWithoutLockfile,
    analyzeCode,
    analyzeAndWriteCodeInference,
    analyseInterestingCode,
    analyzeCodebase
}
export const command = 'analyse <path|p> [verbose|v] [openai|o] [streaming|s] [ignore|i]'

export const describe = 'Analyse the given directory structure to understand the project structure and dependencies'

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
    yargs.option('ignore', {
        alias: 'i',
        describe: 'Specify files or directories to ignore during analysis',
        type: 'array',
        default: []
    })

    return yargs
}



export async function handler(argv: Arguments) {
    const isVerbose = argv.verbose as boolean || argv.v as boolean || false as boolean
    const useOpenAi = argv.openai as boolean || argv.o as boolean || true as boolean
    const allowStreaming = argv.streaming as boolean || argv.s as boolean || false as boolean
    const ignore = argv.ignore as string[] || argv.i as string[] || []
    if (isVerbose) {
        console.log(`Analyse the given directory structure to understand the project structure and dependencies: ${argv.path}`)
    }
    const config = readConfig()
    const rootDir = config.ANALYSIS_DIR

    const projectName = argv.path as string

    const isProjectRoot = rootDir === 'p'


    const openai = new OpenAIInferrence()

    const llmInterface: LlmInterface = openai


    if (isProjectRoot) {
        addAnalysisInGitIgnore(projectName)
    }
    console.log(`Analysing ${chalk.redBright(projectName)}'s file structure to getting started.`)
    // const defaultSpinner = ora().start()
    const path = argv.path as string
    const isRoot = true
    const sourceCodePath = argv.path as string
    const dirToWriteAnalysis = isProjectRoot ? `${sourceCodePath}/.SourceSailor` : `${rootDir}/.SourceSailor/${projectName}`


    const {directoryInferrence, directoryStructureWithContent} = await analyseDirectoryStructure(path, isVerbose, isRoot,
        dirToWriteAnalysis, useOpenAi, isProjectRoot, ignore, llmInterface)

    if (isVerbose) {
        console.log({project: argv.path, directoryInferrence})
    }




    // console.log(`Analysing ${chalk.redBright(projectName)}'s file structure to getting started.`)
    if (!directoryInferrence.isMonorepo) {

        await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming, isVerbose, dirToWriteAnalysis, isProjectRoot, llmInterface)
        const directoryStructureWithoutLockFile = await getDirectoryWithoutLockfile(directoryInferrence, directoryStructureWithContent, isVerbose)

        await analyzeCode(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose,
            dirToWriteAnalysis, isProjectRoot, llmInterface)
    } else {

        if (isVerbose) {
            console.log({directories: directoryInferrence.directories})
        }

        for await (const directory of directoryInferrence.directories) {
            console.log(`Analysing ${directory}'s file structure to getting started.`)
            const sourceCodePath = `${argv.path}/${directory}`

            const analysisRootDir = isProjectRoot ? `${sourceCodePath}/.SourceSailor` : `${rootDir}/.SourceSailor/${projectName}/${directory}`
            try {

                const {directoryInferrence, directoryStructureWithContent} = await analyseDirectoryStructure(sourceCodePath, isVerbose,
                    false, analysisRootDir, useOpenAi, isProjectRoot, ignore, llmInterface)

                await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming,
                    isVerbose, analysisRootDir, isProjectRoot, llmInterface)

                const directoryStructureWithoutLockFile = await getDirectoryWithoutLockfile(directory, directoryStructureWithContent, isVerbose)
                await analyzeCode(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, analysisRootDir,
                    isProjectRoot, llmInterface)
            } catch (error) {
                const errorAnalysisSkipped = `Error analysing ${directory}: Moving on to next directory...`
                console.error(errorAnalysisSkipped)
                writeError(analysisRootDir, 'ReadingDir', (error as Error).stack, errorAnalysisSkipped)
                if (isVerbose) {
                    console.error(error)
                }
            }
        }

    }
    if (!config.userExpertise) {
        console.log(chalk.yellow("User expertise is not set. Setting your expertise level will help us provide more tailored analysis."))
        const setExpertise = await confirm({message: "Would you like to set your expertise now?", default: true})
        if (setExpertise) {
            await setExpertiseHandler()
        }
    }
}


async function analyseDirectoryStructure(path: string, isVerbose: boolean | undefined,
    isRoot: boolean, projectName: string, useOpenAi: boolean, isProjectRoot: boolean | undefined,
    ignore: string[], llm: LlmInterface) {
    const spinner = ora('Analyzing the directory structure...').start()
    const directoryStructureWithContent = await getDirStructure(path, ignore, isVerbose)

    const directoryStructure: FileNode = JSON.parse(JSON.stringify(directoryStructureWithContent))

    function deleteContent(file: FileNode) {
        delete file.content
        if (file.children) {
            for (const child of file.children) {
                deleteContent(child)
            }
        }
    }

    for (const file of directoryStructure.children ?? []) {
        deleteContent(file)
    }

    spinner.text = 'Got the directory structure'

    if (isRoot) {
        writeAnalysis(projectName, "directoryStructure", directoryStructure, true, isProjectRoot)
        writeAnalysis(projectName, "directoryStructureWithFileContent", directoryStructureWithContent, true, isProjectRoot)
    }
    spinner.text = "Analyzing the project directory for codebase shape..."

    const directoryInferrenceResponse = await llm.inferProjectDirectory(JSON.stringify(directoryStructure), useOpenAi, false, isVerbose)
    const directoryInferrence = JSON.parse(directoryInferrenceResponse ?? "")

    if (isVerbose) {
        console.log({isProjectRoot, projectName, directoryInferrence})
    }
    writeAnalysis(projectName, "directoryInferrence", directoryInferrence, true, isProjectRoot)
    // const message =
    spinner.text = "Analyzed the directory structure..."
    spinner.stopAndPersist({symbol: '✔️', text: `Inferred workflow: ${directoryInferrence.workflow}`})

    return {directoryInferrence, directoryStructureWithContent}
}

async function analyzeCode(directoryStructureWithoutLockFile: FileNode, useOpenAi: boolean, allowStreaming: boolean,
    isVerbose: boolean, projectName: string, isProjectRoot: boolean, llmInterface: LlmInterface) {

    await analyzeAndWriteCodeInference(directoryStructureWithoutLockFile, useOpenAi, allowStreaming,
        isVerbose, projectName, isProjectRoot, llmInterface)
}

async function analyzeAndWriteCodeInference(directoryStructureWithoutLockFile: FileNode,
    useOpenAi: boolean, allowStreaming: boolean, isVerbose: boolean,
    projectName: string, isProjectRoot: boolean, llmInterface: LlmInterface) {
    let codeInferrenceResponse: string | undefined = await analyzeCodebase(directoryStructureWithoutLockFile, useOpenAi
        , allowStreaming, isVerbose, llmInterface)
    const interestingCodeResponse: string | undefined = await analyseInterestingCode(directoryStructureWithoutLockFile, useOpenAi,
        allowStreaming, isVerbose, llmInterface)
    // Concatenate the code inferrence and interesting code
    codeInferrenceResponse += interestingCodeResponse
    writeAnalysis(projectName, "codeInferrence", codeInferrenceResponse, false, isProjectRoot)
}

async function analyseInterestingCode(directoryStructureWithoutLockFile: FileNode,
    useOpenAi: boolean, allowStreaming: boolean, isVerbose: boolean, llmInterface: LlmInterface) {
    const spinner = ora('Analysing interesting code').start()
    try {

        const interestingCode = await llmInterface.inferInterestingCode(JSON.stringify(directoryStructureWithoutLockFile), useOpenAi, allowStreaming, isVerbose)
        let interestingCodeResponse = ""
        if (allowStreaming) {
            spinner.stop().clear()
            for await (const chunk of interestingCode as Stream<ChatCompletionChunk>) {
                const message = chunk.choices[0]?.delta.content || ""
                process.stdout.write(message)
                interestingCodeResponse += message
            }
            process.stdout.write("\n")
        } else {
            const interestingCodeAsString = interestingCode as string
            spinner.stopAndPersist({symbol: '✔️', text: interestingCodeAsString})

            interestingCodeResponse = interestingCodeAsString
        }
        return interestingCodeResponse
    } catch (error) {
        spinner.stopAndPersist({symbol: '❌', text: 'Error inferring code'})
        console.error(error)
        return `Error inferring interesting code: ${(error as Error).message}`
    }

}

async function analyzeCodebase(directoryStructureWithoutLockFile: FileNode, useOpenAi: boolean,
    allowStreaming: boolean, isVerbose: boolean, llmInterface: LlmInterface) {
    const spinner = ora('Reading Codebase and inferring code...').start()
    try {
        const codeInferrence = await llmInterface.inferCode(JSON.stringify(directoryStructureWithoutLockFile), useOpenAi, allowStreaming, isVerbose)
        let codeInferrenceResponse = ""
        if (allowStreaming) {
            spinner.stop().clear()
            for await (const chunk of codeInferrence as Stream<ChatCompletionChunk>) {
                const message = chunk.choices[0]?.delta.content || ""
                process.stdout.write(message)
                codeInferrenceResponse += message
            }
            process.stdout.write("\n")
        } else {
            const codeInferrenceAsString = codeInferrence as string
            spinner.stopAndPersist({symbol: '✔️', text: codeInferrenceAsString})
            codeInferrenceResponse = codeInferrenceAsString
        }
        return codeInferrenceResponse
    } catch (error) {
        spinner.stopAndPersist({symbol: '❌', text: 'Error inferring code'})
        if (isVerbose) {
            console.error(error)
        }
        return `Error inferring code: ${(error as Error).message}`
    }
}




async function inferDependenciesAndWriteAnalysis(sourceCodePath: string, directoryInferrence: any,
    useOpenAi: boolean, allowStreaming: boolean, isVerbose: boolean,
    projectName: string, isProjectRoot: boolean, llmInterface: LlmInterface) {
    const spinner = ora('Inferring dependencies...').start()
    if (isVerbose) {
        console.log({sourceCodePath, projectName, directoryInferrence})
    }

    if (!directoryInferrence.dependenciesFile || directoryInferrence.dependenciesFile.trim() === '') {
        return
    }
    const depenencyFile = fs.readFileSync(`${sourceCodePath}/${directoryInferrence.dependenciesFile}`, 'utf-8')
    const dependencyInferrence = await llmInterface.inferDependency(depenencyFile, directoryInferrence.workflow, useOpenAi, allowStreaming, isVerbose)

    let dependencyInferrenceResponse = ""
    if (allowStreaming) {
        spinner.stop().clear()
        for await (const chunk of dependencyInferrence as Stream<ChatCompletionChunk>) {
            const message = chunk.choices[0]?.delta.content || ""
            process.stdout.write(message)
            dependencyInferrenceResponse += message
        }

        process.stdout.write("\n")

    } else {
        const dependencyInferrenceAsString = dependencyInferrence as string
        spinner.stopAndPersist({symbol: '✔️', text: dependencyInferrenceAsString})

        dependencyInferrenceResponse = dependencyInferrenceAsString
    }
    writeAnalysis(projectName, "dependencyInferrence", dependencyInferrenceResponse, isProjectRoot)
}

async function getDirectoryWithoutLockfile(directoryInferrence: any, directoryStructureWithContent: FileNode | undefined, isVerbose: boolean) {

    const lockfile = directoryInferrence.lockFile
    const directoryStructureWithoutLockFile = JSON.parse(JSON.stringify(directoryStructureWithContent))
    removeLockFile(directoryStructureWithoutLockFile, lockfile)
    if (isVerbose) {
        console.log({directoryStructureWithoutLockFile})
    }

    return directoryStructureWithoutLockFile
}

// Find the lockfile recursively and remove it from entry
function removeLockFile(file: FileNode | undefined, lockfile: string) {
    if (file?.children) {
        for (const child of file.children) {
            if (child.name === lockfile) {
                file.children = file.children.filter(child => child.name !== lockfile)
            } else {
                removeLockFile(child, lockfile)
            }
        }
    }
}

export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']
