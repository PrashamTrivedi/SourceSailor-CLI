import fs from 'fs'
import os from 'os'
import path from 'path'

export const command = 'setup [apiKey|k] [model|m]'

export const describe = 'Setup OpenAI API Key and default model'

export function builder(yargs) {

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

    return yargs
}

export function handler(argv) {
    console.log(`Setting up OpenAI API Key: ${argv.apiKey} and default model: ${argv.model}`)
    const homeDir = os.homedir()
    const configFile = path.join(homeDir, '.SourceSailor', 'config.json')
    const config = {
        OPENAI_API_KEY: argv.apiKey,
        DEFAULT_OPENAI_MODEL: argv.model
    }
    fs.writeFileSync(configFile, JSON.stringify(config))
}

export const usage = '$0 <cmd> [args]'

// export const aliases = ['h', 'help']