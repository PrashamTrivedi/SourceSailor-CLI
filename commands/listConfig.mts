import {readConfig} from "../utils.mjs"
import { handler as getExpertiseHandler } from './getExpertise.mts';
import inquirer from 'inquirer';

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

        if (!config.expertise) {
            const { setExpertise } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'setExpertise',
                    message: 'Your expertise level is not set. Would you like to set it now?',
                    default: true,
                },
            ]);

            if (setExpertise) {
                await getExpertiseHandler(argv);
            } else {
                console.log('You can set your expertise level later using the setExpertise command.');
            }
        }
    } catch (error) {
        console.error('Error reading config:', error)
    }
}

export const usage = '$0 <cmd> [args]'

export const aliases = ['h', 'help']
