#!/usr/bin/env node

import yargs from "yargs"
import {hideBin} from "yargs/helpers"
import * as SetupCommand from './commands/setup.mjs'
import * as DirectoryProcessor from "./commands/analyse.mjs"
import * as ListModelsProcessor from "./commands/listModels.mjs"
import * as ListConfigProcessor from "./commands/listConfig.mjs"
import * as UpdateConfigProcessor from "./commands/updateConfig.mjs"
import * as PrepareReportProcessor from "./commands/prepareReport.mjs"
import * as GetDirStructure from "./commands/getDirStructure.mjs"

const yargsSetup = yargs(hideBin(process.argv))
// console.log("Hello there")

yargsSetup.
    scriptName('SourceSailor')
    .usage('$0 <cmd> [args]')
    .completion()
    .command('$0', 'the default command', () => { }, () => {
        yargsSetup.help().parse()
    })
    .command(SetupCommand)
    .command(DirectoryProcessor)
    .command(ListModelsProcessor)
    .command(ListConfigProcessor)
    .command(UpdateConfigProcessor)
    .command(PrepareReportProcessor)
    .command(GetDirStructure)
    .help()
    .alias('h', 'help')
    .demandCommand(1)
    .parse()

