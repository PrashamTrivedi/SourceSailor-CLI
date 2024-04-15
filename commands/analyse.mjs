import {getDirStructure} from "../directoryProcessor.mjs"
import {calculateTokens, inferCode, inferCodeAST, inferDependency, inferFileImports, inferInterestingCode, inferInterestingCodeAST, inferProjectDirectory} from "../openai.mjs"
import {analyseFileContents, parseTree} from "../treeParser.mjs"
import fs from 'fs'
import {addAnalysisInGitIgnore, readConfig, writeAnalysis, writeError} from "../utils.mjs"
import {type} from "os"
import {Stream} from "openai/streaming"
import {UnknownLanguageError, getTreeSitterFromFileName} from "../treeSitterFromFieNames.mjs"
export const command = 'analyse <path|p> [verbose|v] [openai|o] [streaming|s]'

export const describe = 'Analyse the given directory structure to understand the project structure and dependencies'

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
    const config = readConfig()

    const rootDir = config.ANALYSIS_DIR

    const projectName = argv.path

    const isProjectRoot = rootDir === 'p'



    if (isProjectRoot) {
        addAnalysisInGitIgnore(projectName)
    }
    console.log("Reading codebase structure and file...")
    const path = argv.path
    const isRoot = true
    const sourceCodePath = argv.path
    const dirToWriteAnalysis = isProjectRoot ? `${sourceCodePath}/.SourceSailor` : `${rootDir}/.SourceSailor/${projectName}`

    const {directoryInferrence, directoryStructureWithContent} = await analyseDirectoryStructure(path, isVerbose, isRoot, dirToWriteAnalysis, useOpenAi, isProjectRoot)

    if (isVerbose) {
        console.log({project: argv.path, directoryInferrence})
    }



    console.log(`Analysing ${projectName}'s file structure to getting started.`)

    if (!directoryInferrence.isMonorepo) {

        await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming, isVerbose, dirToWriteAnalysis, isProjectRoot)

        const {tokenLength, directoryStructureWithoutLockFile} = await calculateCodebaseTokens(directoryInferrence, directoryStructureWithContent, isVerbose)
        await analyzeCode(tokenLength, directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, dirToWriteAnalysis, isProjectRoot)
        await updateReadme(projectName, sourceCodePath, isProjectRoot)
    } else {

        if (isVerbose) {
            console.log({directories: directoryInferrence.directories})
        }

        for await (const directory of directoryInferrence.directories) {
            console.log(`Analysing ${directory}'s file structure to getting started.`)
            const sourceCodePath = `${argv.path}/${directory}`

            const analysisRootDir = isProjectRoot ? `${sourceCodePath}/.SourceSailor` : `${rootDir}/.SourceSailor/${projectName}/${directory}`
            try {

                const {directoryInferrence, directoryStructureWithContent} = await analyseDirectoryStructure(sourceCodePath, isVerbose, false, analysisRootDir, useOpenAi, isProjectRoot)

                await inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming, isVerbose, analysisRootDir, isProjectRoot)

                const {tokenLength, directoryStructureWithoutLockFile} = await calculateCodebaseTokens(directory, directoryStructureWithContent, isVerbose)
                await analyzeCode(tokenLength, directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, analysisRootDir, isProjectRoot)
            } catch (error) {
                const errorAnalysisSkipped = `Error analysing ${directory}: Moving on to next directory...`
                console.error(errorAnalysisSkipped)
                writeError(analysisRootDir, 'ReadingDir', error.stack, errorAnalysisSkipped)
                if (isVerbose) {
                    console.error(error)
                }
            }
        }

        await updateMonoRepoReadme(projectName, sourceCodePath, isProjectRoot)



    }
}

async function updateReadme(projectName, sourceCodePath, isProjectRoot) {
}

async function updateMonoRepoReadme(projectName, sourceCodePath, isProjectRoot) {
}
async function analyseDirectoryStructure(path, isVerbose, isRoot, projectName, useOpenAi, isProjectRoot) {
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
        writeAnalysis(projectName, "directoryStructure", directoryStructure, true, isProjectRoot)
        writeAnalysis(projectName, "directoryStructureWithFileContent", directoryStructureWithContent, true, isProjectRoot)
    }
    const directoryInferrenceResponse = await inferProjectDirectory(directoryStructure, useOpenAi, false, isVerbose)
    const directoryInferrence = JSON.parse(directoryInferrenceResponse ?? "")

    console.log({isProjectRoot, projectName, directoryInferrence})
    writeAnalysis(projectName, "directoryInferrence", directoryInferrence, true, isProjectRoot)
    // const message =
    console.log("Analyzed the directory structure...")
    console.log(`Inferred workflow: ${directoryInferrence.workflow}`)
    return {directoryInferrence, directoryStructureWithContent}
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
                console.error(`Error analyzing ${node.name}:`, error)
            }
        }
    }

    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            await traverseAndAnalyze(isVerbose, child)
        }
    }
}
async function analyzeCode(tokenLength, directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName, isProjectRoot) {
    if (tokenLength <= 128000) {
        await analyzeAndWriteCodeInference(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName, isProjectRoot)
    } else {


        await traverseAndAnalyze(isVerbose, directoryStructureWithoutLockFile)


        await analyzeAndWriteCodeInferenceAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName, isProjectRoot)

        console.log("This codebase is too big for full code analysis, but we've performed an AST analysis.")
        writeAnalysis(projectName, "codeTokens", `Token length of entire codebase: ${tokenLength}, path: ${projectName}. AST analysis performed.`, isProjectRoot)
    }
}

async function analyzeAndWriteCodeInference(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName, isProjectRoot) {
    let codeInferrenceResponse = await analyzeCodebase(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    console.log("Getting some interesting parts of code..")
    let interestingCodeResponse = await analyseInterestingCode(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    // Concatenate the code inferrence and interesting code
    codeInferrenceResponse += interestingCodeResponse
    writeAnalysis(projectName, "codeInferrence", codeInferrenceResponse, false, isProjectRoot)
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


async function analyzeAndWriteCodeInferenceAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose, projectName, isProjectRoot) {
    let codeInferrenceResponse = await analyzeCodebaseAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    console.log("Getting some interesting parts of code based on AST...")
    let interestingCodeResponse = await analyseInterestingCodeAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
    // Concatenate the code inferrence and interesting code
    codeInferrenceResponse += interestingCodeResponse
    writeAnalysis(projectName, "codeInferrenceAST", codeInferrenceResponse, false, isProjectRoot)
}

async function analyseInterestingCodeAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose) {
    const interestingCode = await inferInterestingCodeAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
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

async function analyzeCodebaseAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose) {
    console.log("Reading Codebase AST and inferring code...")
    const codeInferrence = await inferCodeAST(directoryStructureWithoutLockFile, useOpenAi, allowStreaming, isVerbose)
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

async function inferDependenciesAndWriteAnalysis(sourceCodePath, directoryInferrence, useOpenAi, allowStreaming, isVerbose, projectName, isProjectRoot) {
    console.log("Reading dependency file...")
    if (isVerbose) {
        console.log({sourceCodePath, projectName, directoryInferrence})
    }
    if (!directoryInferrence.dependenciesFile || directoryInferrence.dependenciesFile.trim() === '') {
        return
    }
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
    writeAnalysis(projectName, "dependencyInferrence", dependencyInferrenceResponse, isProjectRoot)
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