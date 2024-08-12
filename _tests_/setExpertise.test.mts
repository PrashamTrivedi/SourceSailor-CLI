import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import inquirer from 'inquirer'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { handler } from '../commands/setExpertise.mts'

vi.mock('inquirer')
vi.mock('fs')
vi.mock('os')
vi.mock('path')

describe('setExpertise command', () => {
  const mockHomeDir = '/mock/home'
  const mockConfigPath = '/mock/home/.SourceSailor/config.json'
  const mockConfigData = {
    expertise: 'Intermediate',
    languages: ['JavaScript', 'Python'],
    frameworks: ['React', 'Django']
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(os.homedir).mockReturnValue(mockHomeDir)
    vi.mocked(path.join).mockReturnValue(mockConfigPath)
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfigData))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should prompt the user for expertise level, languages, and frameworks', async () => {
    const mockAnswers = {
      expertise: 'Advanced',
      languages: ['JavaScript', 'Python'],
      frameworks: ['React', 'Django']
    }
    vi.mocked(inquirer.prompt).mockResolvedValue(mockAnswers)

    await handler({ _: [], $0: '' })

    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'list',
        name: 'expertise',
        message: 'Select your expertise level:',
        choices: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
      },
      {
        type: 'checkbox',
        name: 'languages',
        message: 'Select the programming languages you are proficient in:',
        choices: ['JavaScript', 'Python', 'Java', 'C#', 'Ruby', 'Go', 'PHP', 'C++', 'TypeScript', 'Swift', 'Kotlin']
      },
      {
        type: 'checkbox',
        name: 'frameworks',
        message: 'Select the frameworks you are proficient in:',
        choices: expect.any(Function)
      }
    ])
  })

  it('should store the user expertise level in the configuration file', async () => {
    const mockAnswers = {
      expertise: 'Advanced',
      languages: ['JavaScript', 'Python'],
      frameworks: ['React', 'Django']
    }
    vi.mocked(inquirer.prompt).mockResolvedValue(mockAnswers)

    await handler({ _: [], $0: '' })

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockConfigPath,
      JSON.stringify({
        expertise: 'Advanced',
        languages: ['JavaScript', 'Python'],
        frameworks: ['React', 'Django']
      }, null, 2)
    )
  })

  it('should handle errors when parsing the config file', async () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('File read error')
    })
    const consoleErrorSpy = vi.spyOn(console, 'error')

    const mockAnswers = {
      expertise: 'Advanced',
      languages: ['JavaScript', 'Python'],
      frameworks: ['React', 'Django']
    }
    vi.mocked(inquirer.prompt).mockResolvedValue(mockAnswers)

    await handler({ _: [], $0: '' })

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error parsing config file:', expect.any(Error))
  })
})
