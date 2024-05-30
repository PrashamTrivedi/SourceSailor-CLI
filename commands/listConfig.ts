import {readConfig} from "../utils"

export const command = 'listConfig [verbose]'

export const describe = 'List all available Configs'

export function builder(yargs) {
    return yargs
}

export async function handler(argv) {
    console.log(`List all available Configs`)
    const config = readConfig()
    console.log(config)
}

export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']