/* eslint-disable @typescript-eslint/no-explicit-any */
import {readConfig, writeConfig} from '../utils.mjs'
import chalk from 'chalk'
import {confirm, select} from '@inquirer/prompts'
export const command = 'setExpertise'

export const describe = 'Set the user expertise level for various programming languages and frameworks'

export function builder(yargs: any) {
  return yargs
}
interface Language {
  name: string, frameworks: string[]
}

interface Choice {
  name: string, value: string, description: string
}

const languagesAndPlatforms: Language[] = [
  {name: 'JavaScript', frameworks: ['React', 'Angular', 'Vue.js', 'Express', 'Node.js']},
  {name: 'Python', frameworks: ['Django', 'Flask', 'FastAPI', 'Pyramid']},
  {name: 'Java', frameworks: ['Spring', 'Hibernate', 'Struts', 'JavaServer Faces']},
  {name: 'C#', frameworks: ['.NET Core', 'ASP.NET', 'Entity Framework', 'Xamarin']},
  {name: 'Ruby', frameworks: ['Ruby on Rails', 'Sinatra', 'Hanami']},
  {name: 'PHP', frameworks: ['Laravel', 'Symfony', 'CodeIgniter', 'Yii']},
  {name: 'Go', frameworks: ['Gin', 'Echo', 'Beego', 'Revel']},
  {name: 'Rust', frameworks: ['Rocket', 'Actix', 'Warp', 'Tide']},
  {name: 'TypeScript', frameworks: ['NestJS', 'Deno', 'Angular', 'Next.js']},
  {name: 'Swift', frameworks: ['SwiftUI', 'Vapor', 'Perfect', 'Kitura']},
  {name: 'Cloud', frameworks: ['AWS', 'Azure', 'Google Cloud', 'IBM Cloud','Serverless']},
  {name: 'Databases', frameworks: ['SQL', 'NoSQL', 'NewSQL', 'Graph Databases']},
  {name: 'DevOps', frameworks: ['Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions']},
  {name: 'Testing', frameworks: ['Jest', 'Mocha', 'Cypress', 'Selenium']},
  {name: 'Mobile', frameworks: ['React Native', 'Flutter', 'Xamarin', 'NativeScript']},
  {name: 'Web', frameworks: ['HTML', 'CSS', 'JavaScript', 'WebAssembly']},

]

const expertiseLevels: Choice[] = [
  {name: 'Beginner', value: 'beginner', description: 'Beginner'},
  {name: 'Intermediate', value: 'intermediate', description: 'Intermediate'},
  {name: 'Expert', value: 'expert', description: 'Expert'}
]

export async function handler() {
  try {
    const config = await readConfig()
    config.userExpertise = {}

    console.log(chalk.blue('Welcome to the expertise assessment questionnaire!'))
    console.log(chalk.yellow('Please answer the following questions about your programming expertise.'))

    for (const lang of languagesAndPlatforms) {
      const knowsLanguage = await confirm({
        message: `Do you have experience with ${lang.name}?`,
        default: false
      })

      if (knowsLanguage) {
        const languageLevel = await select({
          message: `What is your expertise level in ${lang.name}?`,
          choices: expertiseLevels,
          default: 'beginner'
        })

        config.userExpertise[lang.name] = languageLevel

        for (const framework of lang.frameworks) {
          const knowsFramework = await confirm({
            message: `Do you have experience with ${framework}?`,
            default: false
          })

          if (knowsFramework) {
            const frameworkLevel = await select({
              message: `What is your expertise level in ${framework}?`,
              choices: expertiseLevels,
              default: 'beginner'
            })

            config.userExpertise[framework] = frameworkLevel
          }
        }
      }
    }

    await writeConfig(config)
    console.log(chalk.green('Expertise levels have been successfully set and saved!'))
  } catch (error) {
    console.error(chalk.red('Error setting user expertise levels:'), error)
  }
}

export const usage = '$0 <cmd>'

export const aliases = ['expertise', 'skillLevel', 'profile', 'h', 'help']
