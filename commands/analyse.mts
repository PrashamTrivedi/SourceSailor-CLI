/* eslint-disable @typescript-eslint/no-explicit-any */
import {FileNode, getDirStructure} from "../directoryProcessor.mjs"


import fs from 'fs'
import {addAnalysisInGitIgnore, readConfig, writeAnalysis, writeError} from "../utils.mjs"
import ora from 'ora'
import {Arguments} from 'yargs'

import chalk from "chalk"
import {confirm} from '@inquirer/prompts'
import {handler as setExpertiseHandler} from './setExpertise.mjs'
import {markdownToTerminal} from "../terminalRenderrer.mjs"
import {Argv} from 'yargs'
import {LlmInterface} from "../llmInterface.mjs"
import ModelUtils from "../modelUtils.mjs"



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
export const command = 'analyse <path|p> [verbose|v]  [streaming|s] [ignore|i]'

export const describe = 'Analyse the given directory structure to understand the project structure and dependencies'


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
    yargs.option('model', {
        alias: 'm',
        describe: 'Specify the AI model to use for analysis',
        type: 'string'
    })

    return yargs
}



export async function handler(argv: Arguments) {
    const isVerbose = argv.verbose as boolean || argv.v as boolean || false as boolean
    const allowStreaming = argv.streaming as boolean || argv.s as boolean || false as boolean
    const ignore = argv.ignore as string[] || argv.i as string[] || []
    const modelName = argv.model as string || argv.m as string

    const config = readConfig()

    if (isVerbose) {
        console.log(`Analyse the given directory structure to understand the project structure and dependencies: ${argv.path}`)
        console.log(`Using model: ${modelName || config.DEFAULT_OPENAI_MODEL}`)
    }

    const rootDir = config.ANALYSIS_DIR
    const userExpertise = JSON.stringify(config.userExpertise)

    // Handle current directory case
    const inputPath = argv.path as string
    const projectName = inputPath === '.' ? process.cwd().split('/').pop() ?? "" : inputPath

    // Log current directory name if analyzing current directory
    if (inputPath === '.') {
        console.log(`Analyzing current directory: ${projectName}`)
    }

    const isProjectRoot = rootDir === 'p'
    if (isVerbose) {
        console.log({rootDir, isProjectRoot, projectName})
    }

    const modelUtils = ModelUtils.getInstance()
    await modelUtils.initializeModels()

    const llmInterface: LlmInterface = modelUtils.getLlmInterface(modelName || config.DEFAULT_OPENAI_MODEL)
    const selectedModelName = modelName || config.DEFAULT_OPENAI_MODEL

    if (isVerbose) {
        console.log(`Using model: ${llmInterface.getName()}, modelName ${selectedModelName}`)
    }
    if (isProjectRoot) {
        addAnalysisInGitIgnore(projectName)
    }
    console.log(`Analysing ${chalk.redBright(projectName)}'s file structure to getting started.`)
    // const defaultSpinner = ora().start()
    const sourceCodePath = inputPath
    const isRoot = true
    const dirToWriteAnalysis = isProjectRoot ? `${sourceCodePath}/.SourceSailor` : `${rootDir}/.SourceSailor/${projectName}`
if (isVerbose) {
        console.log({sourceCodePath, isProjectRoot, isRoot, dirToWriteAnalysis})
    }

    const {directoryInferrence, directoryStructureWithContent} = await analyseDirectoryStructure(
        sourceCodePath,  // Use sourceCodePath instead of undefined path
        isVerbose,
        isRoot,
        dirToWriteAnalysis,
        isProjectRoot,
        ignore,
        llmInterface,
        userExpertise,
        selectedModelName
    )

    if (isVerbose) {
        console.log({project: argv.path, directoryInferrence})
    }




    // console.log(`Analysing ${chalk.redBright(projectName)}'s file structure to getting started.`)
    if (!directoryInferrence.isMonorepo) {
        if (!directoryInferrence.programmingLanguage) {
            const errorMessage = 'Programming language not defined for non-monorepo project'
            console.error(chalk.red(errorMessage))
            writeError(dirToWriteAnalysis, 'Analysis', errorMessage, 'Analysis stopped due to missing programming language')
            throw new Error(errorMessage)
        }

        await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, allowStreaming, isVerbose, dirToWriteAnalysis, isProjectRoot, llmInterface, userExpertise, selectedModelName)
        const directoryStructureWithoutLockFile = await getDirectoryWithoutLockfile(directoryInferrence, directoryStructureWithContent, isVerbose)

        await analyzeCode(directoryStructureWithoutLockFile, allowStreaming, isVerbose,
            dirToWriteAnalysis, isProjectRoot, llmInterface, userExpertise, selectedModelName)
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
                    false, analysisRootDir, isProjectRoot, ignore, llmInterface, userExpertise, selectedModelName)

                await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, allowStreaming,
                    isVerbose, analysisRootDir, isProjectRoot, llmInterface, userExpertise, selectedModelName)

                const directoryStructureWithoutLockFile = await getDirectoryWithoutLockfile(directory, directoryStructureWithContent, isVerbose)
                await analyzeCode(directoryStructureWithoutLockFile, allowStreaming, isVerbose, analysisRootDir,
                    isProjectRoot, llmInterface, userExpertise, selectedModelName)
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


async function analyseDirectoryStructure(path: string, isVerbose: boolean,
    isRoot: boolean, projectName: string, isProjectRoot: boolean | undefined,
    ignore: string[], llm: LlmInterface, userExpertise?: string, modelName?: string) {
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

    const directoryInferrenceResponse = await llm.inferProjectDirectory(JSON.stringify(directoryStructure), false, isVerbose, userExpertise, modelName)
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

async function analyzeCode(directoryStructureWithoutLockFile: FileNode, allowStreaming: boolean,
    isVerbose: boolean, projectName: string, isProjectRoot: boolean, llmInterface: LlmInterface, userExpertise?: string, modelName?: string) {

    await analyzeAndWriteCodeInference(directoryStructureWithoutLockFile, allowStreaming,
        isVerbose, projectName, isProjectRoot, llmInterface, userExpertise, modelName)
}

async function analyzeAndWriteCodeInference(directoryStructureWithoutLockFile: FileNode,
    allowStreaming: boolean, isVerbose: boolean,
    projectName: string, isProjectRoot: boolean, llmInterface: LlmInterface, userExpertise?: string, modelName?: string) {
    let codeInferrenceResponse: string | undefined = await analyzeCodebase(directoryStructureWithoutLockFile, allowStreaming, isVerbose, llmInterface, userExpertise, modelName)
    const interestingCodeResponse: string | undefined = await analyseInterestingCode(directoryStructureWithoutLockFile,
        allowStreaming, isVerbose, llmInterface, userExpertise, modelName)
    // Concatenate the code inferrence and interesting code
    codeInferrenceResponse += interestingCodeResponse
    writeAnalysis(projectName, "codeInferrence", codeInferrenceResponse, false, isProjectRoot)
}

async function analyseInterestingCode(directoryStructureWithoutLockFile: FileNode,
    allowStreaming: boolean, isVerbose: boolean, llmInterface: LlmInterface, userExpertise?: string, modelName?: string) {
    const spinner = ora('Analysing interesting code').start()
    try {

        const interestingCode = await llmInterface.inferInterestingCode(JSON.stringify(directoryStructureWithoutLockFile), allowStreaming, isVerbose, userExpertise, modelName)
        let interestingCodeResponse = ""
        if (allowStreaming) {
            spinner.stop().clear()
            for await (const chunk of interestingCode as AsyncIterable<string>) {


                process.stdout.write(chunk)
                interestingCodeResponse += chunk

            }
            process.stdout.write("\n")
        } else {
            const interestingCodeAsString = interestingCode as string
            const markDownMessage = markdownToTerminal(interestingCodeAsString)

            spinner.stopAndPersist({symbol: '✔️', text: markDownMessage})

            interestingCodeResponse = interestingCodeAsString
        }
        return interestingCodeResponse
    } catch (error) {
        spinner.stopAndPersist({symbol: '❌', text: 'Error inferring code'})
        console.error(error)
        return `Error inferring interesting code: ${(error as Error).message}`
    }

}

async function analyzeCodebase(directoryStructureWithoutLockFile: FileNode,
    allowStreaming: boolean, isVerbose: boolean, llmInterface: LlmInterface, userExpertise?: string, modelName?: string) {
    const spinner = ora('Reading Codebase and inferring code...').start()
    try {

        const codeInferrence = await llmInterface.inferCode(JSON.stringify(directoryStructureWithoutLockFile), allowStreaming, isVerbose, userExpertise, modelName)
        let codeInferrenceResponse = ""
        if (allowStreaming) {
            spinner.stop().clear()
            for await (const chunk of codeInferrence as AsyncIterable<string>) {
                process.stdout.write(chunk)
                codeInferrenceResponse += chunk
            }
            process.stdout.write("\n")
        } else {
            const codeInferrenceAsString = codeInferrence as string
            const markDownMessage = markdownToTerminal(codeInferrenceAsString)
            spinner.stopAndPersist({symbol: '✔️', text: markDownMessage})
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
    allowStreaming: boolean, isVerbose: boolean,
    projectName: string, isProjectRoot: boolean, llmInterface: LlmInterface, userExpertise?: string, modelName?: string) {
    const spinner = ora('Inferring dependencies...').start()
    if (isVerbose) {
        console.log({sourceCodePath, projectName, directoryInferrence})
    }

    if (!directoryInferrence.dependenciesFile || directoryInferrence.dependenciesFile.trim() === '') {
        spinner.stopAndPersist({symbol: '❌', text: 'No dependencies file'})
        return
    }
    const depenencyFile = fs.readFileSync(`${sourceCodePath}/${directoryInferrence.dependenciesFile}`, 'utf-8')
    try {
        const dependencyInferrence = await llmInterface.inferDependency(depenencyFile, directoryInferrence.workflow, allowStreaming, isVerbose, userExpertise, modelName)

        let dependencyInferrenceResponse = ""
        if (allowStreaming) {
            spinner.stop().clear()
            for await (const chunk of dependencyInferrence as AsyncIterable<string>) {

                process.stdout.write(chunk)
                dependencyInferrenceResponse += chunk
            }

            process.stdout.write("\n")

        } else {
            const dependencyInferrenceAsString = dependencyInferrence as string
            const markDownMessage = markdownToTerminal(dependencyInferrenceAsString)
            spinner.stopAndPersist({symbol: '✔️', text: markDownMessage})

            dependencyInferrenceResponse = dependencyInferrenceAsString
        }
        writeAnalysis(projectName, "dependencyInferrence", dependencyInferrenceResponse, isProjectRoot)
    } catch (error) {
        spinner.stopAndPersist({symbol: '❌', text: 'Error inferring dependencies'})
        console.error(error)
    }
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
