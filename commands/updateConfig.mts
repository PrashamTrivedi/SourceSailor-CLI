

import fs from 'fs'
import os from 'os'
import path from 'path'

export const command = 'updateConfig [apiKey|k] [model|m]'

export const describe = 'Update OpenAI API Key and default model'

export function builder(yargs) {
    yargs.option('apiKey', {
        describe: 'OpenAI API Key',
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

    return yargs
}

export function handler(argv) {
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

    fs.writeFileSync(configFile, JSON.stringify(configData))
}
export const usage = '$0 <cmd> [args]'