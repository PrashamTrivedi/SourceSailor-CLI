import {getDirStructure} from "../directoryProcessor.mjs"
import {calculateTokens, inferCode, inferDependency, inferFileImports, inferInterestingCode, inferProjectDirectory} from "../openai.mjs"
import {parseTree} from "../treeParser.mjs"
import fs from 'fs'
import {addAnalysisInGitIgnore, writeAnalysis} from "../utils.mjs"
import {type} from "os"
import {Stream} from "openai/streaming"
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
    const allowStreaming = argv.streaming || argv.s || false
    if (isVerbose) {
        console.log(`Analyse the given directory structure to understand the project structure and dependencies: ${argv.path}`)
    }
    const projectName = argv.path
    addAnalysisInGitIgnore(projectName)
    console.log("Reading codebase structure and file...")
    const path = argv.path
    const isRoot = true
    const {directoryInferrence, directoryStructureWithContent} = await analyseDirectoryStructure(path, isVerbose, isRoot, projectName, useOpenAi)

    if (isVerbose) {
        console.log({project: argv.path, directoryInferrence})
    }



    console.log(`Analysing ${projectName}'s file structure to getting started.`)

    if (!directoryInferrence.isMonorepo) {
        const sourceCodePath = argv.path
        await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming, isVerbose, projectName)

        const {tokenLength, directoryStructureWithoutLockFile} = await calculateCodebaseTokens(directoryInferrence, directoryStructureWithContent, isVerbose)
        await analyzeCode(tokenLength, directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName)
    } else {

        if (isVerbose) {
            console.log({directories: directoryInferrence.directories})
        }

        for await (const directory of directoryInferrence.directories) {
            try {
                console.log(`Analysing ${directory}'s file structure to getting started.`)
                const sourceCodePath = `${argv.path}/${directory}`
                const {directoryInferrence, directoryStructureWithContent} = await analyseDirectoryStructure(sourceCodePath, isVerbose, false, projectName, useOpenAi)

                await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming, isVerbose, projectName)

                const {tokenLength, directoryStructureWithoutLockFile} = await calculateCodebaseTokens(directory, directoryStructureWithContent, isVerbose)
                await analyzeCode(tokenLength, directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName)
            } catch (error) {
                console.error(`Error analysing ${directory}: Moving on to next directory...`)
                if (isVerbose) {
                    console.error(error)
                }
            }
        }





    }
}
async function analyseDirectoryStructure(path, isVerbose, isRoot, projectName, useOpenAi) {
    const directoryStructureWithContent = await getDirStructure(path, isVerbose)

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


    if (isRoot) {
        writeAnalysis(projectName, "directoryStructure", directoryStructure, true)
        writeAnalysis(projectName, "directoryStructureWithFileContent", directoryStructureWithContent, true)
    }
    const directoryInferrenceResponse = await inferProjectDirectory(directoryStructure, useOpenAi, false, isVerbose)
    const directoryInferrence = JSON.parse(directoryInferrenceResponse ?? "")

    writeAnalysis(projectName, "directoryInferrence", directoryInferrence, true)
    // const message =
    console.log("Analyzed the directory structure...")
    console.log(`Inferred workflow: ${directoryInferrence.workflow}`)
    return {directoryInferrence, directoryStructureWithContent}
}

async function analyzeCode(tokenLength, directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName) {
    if (tokenLength <= 128000) {
        await analyzeAndWriteCodeInference(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName)
    } else {

        // const tree = await parseTree(`${argv.path}/${directoryInferrence.entryPointFile}`, directoryInferrence.treeSitterLanguage, isVerbose)
        // console.log(tree)
        // const fileImport = await inferFileImports(tree, useOpenAi, allowStreaming, isVerbose)
        // if (allowStreaming) {
        //     for await (const chunk of fileImport) {
        //         const message = chunk.choices[0]?.delta.content || ""
        //         process.stdout.write(message)
        //     }
        //     process.stdout.write("\n")
        // } else {
        //     console.log(fileImport)
        // }
        console.log("This codebase is too big, but hold tight!! We are working on it.")
    }
}

async function analyzeAndWriteCodeInference(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName) {
    let codeInferrenceResponse = await analyzeCodebase(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    console.log("Getting some interesting parts of code..")
    let interestingCodeResponse = await analyseInterestingCode(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    // Concatenate the code inferrence and interesting code
    codeInferrenceResponse += interestingCodeResponse
    writeAnalysis(projectName, "codeInferrence", codeInferrenceResponse)
}

async function analyseInterestingCode(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose) {
    const interestingCode = await inferInterestingCode(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    let interestingCodeResponse = ""
    if (allowStreaming) {
        for await (const chunk of interestingCode) {
            const message = chunk.choices[0]?.delta.content || ""
            process.stdout.write(message)
            interestingCodeResponse += message
        }
        process.stdout.write("\n")
    } else {
        console.log(interestingCode)
        interestingCodeResponse = interestingCode
    }
    return interestingCodeResponse
}

async function analyzeCodebase(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose) {
    console.log("Reading Codebase and inferring code..")
    const codeInferrence = await inferCode(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    let codeInferrenceResponse = ""
    if (allowStreaming) {
        for await (const chunk of codeInferrence) {
            const message = chunk.choices[0]?.delta.content || ""
            process.stdout.write(message)
            codeInferrenceResponse += message
        }
        process.stdout.write("\n")
    } else {
        console.log(codeInferrence)
        codeInferrenceResponse = codeInferrence
    }
    return codeInferrenceResponse
}

async function calculateCodebaseTokens(directoryInferrence, directoryStructureWithContent, isVerbose) {
    const lockfile = directoryInferrence.lockFile
    const directoryStructureWithoutLockFile = JSON.parse(JSON.stringify(directoryStructureWithContent))
    removeLockFile(directoryStructureWithoutLockFile, lockfile)


    const tokenLength = await calculateTokens([{content: JSON.stringify(directoryStructureWithoutLockFile), role: 'user'}])
    if (isVerbose) {
        console.log(`Token length of entire codebase: ${tokenLength}`)
    }
    return {tokenLength, directoryStructureWithoutLockFile}
}

async function inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming, isVerbose, projectName) {
    console.log("Reading dependency file...")
    const depenencyFile = fs.readFileSync(`${sourceCodePath}/${directoryInferrence.dependenciesFile}`, 'utf-8')
    const dependencyInferrence = await inferDependency(depenencyFile, directoryInferrence.workflow, useOpenAi, allowStreaming, isVerbose)


    let dependencyInferrenceResponse = ""
    if (allowStreaming) {

        for await (const chunk of dependencyInferrence) {
            const message = chunk.choices[0]?.delta.content || ""
            process.stdout.write(message)
            dependencyInferrenceResponse += message
        }
        process.stdout.write("\n")

    } else {
        console.log(dependencyInferrence)
        dependencyInferrenceResponse = dependencyInferrence
    }
    writeAnalysis(projectName, "dependencyInferrence", dependencyInferrenceResponse)
}

// Find the lockfile recursively and remove it from entry
function removeLockFile(file, lockfile) {
    if (file.children) {
        for (const child of file.children) {
            if (child.name === lockfile) {
                file.children = file.children.filter(child => child.name !== lockfile)
            } else {
                removeLockFile(child)
            }
        }
    }
}


export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']