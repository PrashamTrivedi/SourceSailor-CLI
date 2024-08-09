import {readConfig} from "../utils.mjs"

export const command = 'listConfig [verbose]'

export const describe = 'List all available Configs'

import { Argv } from 'yargs';

export function builder(yargs: Argv) {
    return yargs
}

import { Arguments } from 'yargs';

export async function handler(argv: Arguments) {
    console.log(`List all available Configs`)
    try {
        const config = readConfig()
        console.log(config)
    } catch (error) {
        console.error('Error reading config:', error)
    }
}

export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']
