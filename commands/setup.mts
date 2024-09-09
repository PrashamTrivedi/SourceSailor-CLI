import fs from 'fs'
import os from 'os'
import path from 'path'

export const command = 'setup [apiKey|k] [model|m]'

export const describe = 'Setup OpenAI API Key and default model'

import { Argv } from 'yargs';

export function builder(yargs: Argv) {

    yargs.option('apiKey', {
        describe: 'OpenAI API Key',
        type: 'string',
        required: true,
        demandOption: true
    })
    yargs.option('model', {
        alias: 'm',
        describe: 'OpenAI Model',
        type: 'string',
        default: 'gpt-3.5-turbo'
    })
    yargs.option('anthropicApiKey', {
        describe: 'Anthropic API Key',
        type: 'string'
    })
    yargs.option('analysisDir', {
        alias: 'a',
        describe: 'Root directory to write the analysis. Default home directory. Use p to use the codebase directory.',
        type: 'string',
        default: os.homedir()
    })

    return yargs
}

import { Arguments } from 'yargs';

export function handler(argv: Arguments) {
    console.log(`Setting up OpenAI API Key: ${argv.apiKey} and default model: ${argv.model}`)
    const homeDir = os.homedir()
    if (!fs.existsSync(path.join(homeDir, '.SourceSailor'))) {
        fs.mkdirSync(path.join(homeDir, '.SourceSailor'))
    }
    const configFile = path.join(homeDir, '.SourceSailor', 'config.json')
    const configFileData = fs.readFileSync(configFile, 'utf8')
    let configData: Record<string, string> = {}
    try {
        configData = JSON.parse(configFileData)
    } catch (error) {
        console.error('Error parsing config file:', error)
    }
    const config = {
        OPENAI_API_KEY: argv.apiKey || configData.OPENAI_API_KEY,
        DEFAULT_OPENAI_MODEL: argv.model || configData.DEFAULT_OPENAI_MODEL,
        ANALYSIS_DIR: argv.analysisDir || configData.ANALYSIS_DIR,
        ANTHROPIC_API_KEY: argv.anthropicApiKey || configData.ANTHROPIC_API_KEY
    }


    fs.writeFileSync(configFile, JSON.stringify(config))
}

export const usage = '$0 <cmd> [args]'

// export const aliases = ['h', 'help']
