import fs from 'fs'
import os from 'os'
import path from 'path'

export const command = 'getExpertise'
export const describe = 'Get your current expertise level'

import { Argv } from 'yargs'

export function builder(yargs: Argv) {
    return yargs
}

import { Arguments } from 'yargs'

export async function handler(argv: Arguments) {
    const homeDir = os.homedir()
    const configFile = path.join(homeDir, '.SourceSailor', 'config.json')
    let configData: Record<string, any> = {}

    if (fs.existsSync(configFile)) {
        const configFileData = fs.readFileSync(configFile, 'utf8')
        try {
            configData = JSON.parse(configFileData)
        } catch (error) {
            console.error('Error parsing config file:', error)
        }
    }

    if (configData.expertise) {
        console.log(`Your current expertise level is ${configData.expertise}`)
    } else {
        console.log('Expertise level is not set. Please run the setExpertise command to set it.')
    }
}

export const aliases = ['expertise', 'profile']
