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
    const directoryStructureWithContent = await getDirStructure(argv.path, isVerbose)

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


    writeAnalysis(projectName, "directoryStructure", directoryStructure, true)
    writeAnalysis(projectName, "directoryStructureWithFileContent", directoryStructureWithContent, true)
    const directoryInferrenceResponse = await inferProjectDirectory(directoryStructure, useOpenAi, false, isVerbose)
    const directoryInferrence = JSON.parse(directoryInferrenceResponse ?? "")

    writeAnalysis(projectName, "directoryInferrence", directoryInferrence, true)
    // const message =
    console.log("Analyzed the directory structure...")

    if (isVerbose) {
        console.log({project: argv.path, directoryInferrence})
    }



    console.log(`Analysing ${projectName}'s file structure to getting started.`)

    const directories = []
    if (!directoryInferrence.isMonorepo) {
        console.log("Reading dependency file...")
        const depenencyFile = fs.readFileSync(`${argv.path}/${directoryInferrence.dependenciesFile}`, 'utf-8')
        const lockfile = directoryInferrence.lockFile
        const directoryStructureWithoutLockFile = JSON.parse(JSON.stringify(directoryStructureWithContent))
        removeLockFile(directoryStructureWithoutLockFile, lockfile)

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

        if (isVerbose) {
            console.log(`Directory Structure With file content: ${JSON.stringify(directoryStructureWithoutLockFile)}`)
        }
        const tokenLength = await calculateTokens([{content: JSON.stringify(directoryStructureWithoutLockFile), role: 'user'}])
        if (isVerbose) {
            console.log(`Token length of entire codebase: ${tokenLength}`)
        }
        if (tokenLength <= 128000) {
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
            console.log("Getting some interesting parts of code..")
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
            // Concatenate the code inferrence and interesting code
            codeInferrenceResponse += interestingCodeResponse
            writeAnalysis(projectName, "codeInferrence", codeInferrenceResponse)
        } else {

            const tree = await parseTree(`${argv.path}/${directoryInferrence.entryPointFile}`, directoryInferrence.treeSitterLanguage, isVerbose)
            console.log(tree)
            const fileImport = await inferFileImports(tree, useOpenAi, allowStreaming, isVerbose)
            if (allowStreaming) {
                for await (const chunk of fileImport) {
                    const message = chunk.choices[0]?.delta.content || ""
                    process.stdout.write(message)

                }
                process.stdout.write("\n")
            } else {
                console.log(fileImport)
            }
        }
    } else {
        directories.push(...directoryInferrence.directories)
    }





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