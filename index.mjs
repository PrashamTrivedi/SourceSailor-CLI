#!/usr/bin/env node

import yargs from "yargs"
import {hideBin} from "yargs/helpers"
import {getDirStructure} from "./directoryProcessor.mjs"
import {inferProjectDirectory} from "./openai.mjs"
import * as SetupCommand from './commands/setup.mjs'
import * as DirectoryProcessor from "./commands/analyse.mjs"
import * as ListModelsProcessor from "./commands/listModels.mjs"
const yargsSetup = yargs(hideBin(process.argv))
// console.log("Hello there")

yargsSetup.
    scriptName('SourceSailor')
    .usage('$0 <cmd> [args]')
    .completion()
    .command('$0', 'the default command', () => { }, (argv) => {
        yargsSetup.help().parse()
    })
    .command(SetupCommand)
    .command(DirectoryProcessor)
    .command(ListModelsProcessor)
    .help()
    .alias('h', 'help')
    .demandCommand(1)
    .parse()


// const argv = yargs(hideBin(process.argv)).argv
// const isVerbose = argv.verbose || argv.v || false
// const useOpenAi = argv.openai || argv.o || false
// const allowStreaming = argv.streaming || argv.s || false
// const openAiApiKey = argv.apiKey || argv.k || process.env.OPENAI_API_KEY

// if (!openAiApiKey) {
//     console.log("Please provide an OpenAI API key with --apiKey flag or OPENAI_API_KEY environment variable")
//     process.exit(1)
// }
// if (!argv.path) {
//     console.log(JSON.stringify(argv))
//     console.log("Please provide a path with --path flag")
// } else {
//     if (isVerbose) {
//         console.log(`You provided a path: ${argv.path}`)
//     }
//     const directoryStructure = await getDirStructure(argv.path, isVerbose)
//     const directoryInferrence = await inferProjectDirectory(directoryStructure, useOpenAi, allowStreaming, isVerbose)

// }