import inquirer from 'inquirer'
import fs from 'fs'
import os from 'os'
import path from 'path'

export const command = 'setExpertise'
export const describe = 'Set your expertise level'

import { Argv } from 'yargs'

export function builder(yargs: Argv) {
    return yargs
}

import { Arguments } from 'yargs'

export async function handler(argv: Arguments) {
    const questions = [
        {
            type: 'list',
            name: 'expertise',
            message: 'Select your expertise level:',
            choices: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        },
        {
            type: 'checkbox',
            name: 'languages',
            message: 'Select the programming languages you are proficient in:',
            choices: ['JavaScript', 'Python', 'Java', 'C#', 'Ruby', 'Go', 'PHP', 'C++', 'TypeScript', 'Swift', 'Kotlin'],
        },
        {
            type: 'checkbox',
            name: 'frameworks',
            message: 'Select the frameworks you are proficient in:',
            choices: (answers) => {
                const frameworks = [];
                if (answers.languages.includes('JavaScript')) {
                    frameworks.push('React', 'Angular', 'Vue', 'Node.js', 'Express');
                }
                if (answers.languages.includes('Python')) {
                    frameworks.push('Django', 'Flask');
                }
                if (answers.languages.includes('Java')) {
                    frameworks.push('Spring Boot');
                }
                if (answers.languages.includes('C#')) {
                    frameworks.push('.NET');
                }
                if (answers.languages.includes('Ruby')) {
                    frameworks.push('Rails');
                }
                if (answers.languages.includes('Go')) {
                    frameworks.push('Gin');
                }
                if (answers.languages.includes('PHP')) {
                    frameworks.push('Laravel');
                }
                if (answers.languages.includes('Swift')) {
                    frameworks.push('Vapor');
                }
                if (answers.languages.includes('Kotlin')) {
                    frameworks.push('Ktor');
                }
                return frameworks;
            },
        },
    ]

    const answers = await inquirer.prompt(questions)

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

    configData.expertise = answers.expertise
    configData.languages = answers.languages
    configData.frameworks = answers.frameworks

    fs.writeFileSync(configFile, JSON.stringify(configData, null, 2))

    console.log(`Your expertise level has been set to ${answers.expertise}`)
    console.log(`Your programming languages are: ${answers.languages.join(', ')}`)
    console.log(`Your frameworks are: ${answers.frameworks.join(', ')}`)
}

export const aliases = ['expertise', 'profile']
