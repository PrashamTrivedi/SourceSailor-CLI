

import fs from 'fs'
import os from 'os'
import path from 'path'

export const command = 'updateConfig [apiKey|k] [model|m]'

export const describe = 'Update OpenAI API Key and default model'

import {Argv} from 'yargs'

export function builder(yargs: Argv) {
    yargs.option('apiKey', {
        describe: 'OpenAI API Key',
        alias: 'k',
        type: 'string',
    })
    yargs.option('model', {
        alias: 'm',
        describe: 'OpenAI Model',
        type: 'string',
    })
    yargs.option('analysisDir', {
        alias: 'a',
        describe: 'Root directory to write the analysis. Default home directory. Use p to use the codebase directory.',
        type: 'string',
    })
    yargs.option('geminiApiKey', {
        describe: 'Gemini API Key',
        alias: 'g',
        type: 'string',
    })
    yargs.option('anthropicApiKey', {
        describe: 'Anthropic API Key',
        alias: 'n',
        type: 'string',
    })

    return yargs
}

import {Arguments} from 'yargs'

export function handler(argv: Arguments) {
    const homeDir = os.homedir()
    const configFile = path.join(homeDir, '.SourceSailor', 'config.json')
    const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'))

    if (argv.apiKey) {
        configData.OPENAI_API_KEY = argv.apiKey
    }
    if (argv.model) {
        configData.DEFAULT_OPENAI_MODEL = argv.model
    }
    if (argv.analysisDir) {
        configData.ANALYSIS_DIR = argv.analysisDir
    }
    if (argv.geminiApiKey) {
        configData.GEMINI_API_KEY = argv.geminiApiKey
    }
    if (argv.anthropicApiKey) {
        configData.ANTHROPIC_API_KEY = argv.anthropicApiKey
    }

    fs.writeFileSync(configFile, JSON.stringify(configData))
}
export const usage = '$0 <cmd> [args]'
