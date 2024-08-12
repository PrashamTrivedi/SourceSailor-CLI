import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../commands/setExpertise.mjs'
import * as utils from '../utils.mjs'
import * as inquirer from '@inquirer/prompts'
import chalk from 'chalk'

vi.mock('../utils.mjs')
vi.mock('@inquirer/prompts')
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((str) => str),
    yellow: vi.fn((str) => str),
    green: vi.fn((str) => str),
    red: vi.fn((str) => str),
  },
}))

describe('setExpertise command', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(utils.readConfig).mockReturnValue({})
    vi.mocked(utils.writeConfig).mockResolvedValue(undefined)
  })

  it('should set expertise levels for languages and frameworks', async () => {
    vi.mocked(inquirer.confirm)
      .mockResolvedValueOnce(true)  // JavaScript
      .mockResolvedValueOnce(true)  // React
      .mockResolvedValueOnce(false) // Angular
      .mockResolvedValueOnce(false) // Vue.js
      .mockResolvedValueOnce(false) // Express
      .mockResolvedValueOnce(false) // Node.js
      .mockResolvedValueOnce(false) // Python

    vi.mocked(inquirer.select)
      .mockResolvedValueOnce('intermediate') // JavaScript
      .mockResolvedValueOnce('expert')       // React

    await handler()

    expect(utils.writeConfig).toHaveBeenCalledWith({
      userExpertise: {
        JavaScript: 'intermediate',
        React: 'expert',
      },
    })

    expect(chalk.green).toHaveBeenCalledWith('Expertise levels have been successfully set and saved!')
  })

  it('should handle when user has no experience in any language', async () => {
    vi.mocked(inquirer.confirm).mockResolvedValue(false)

    await handler()

    expect(utils.writeConfig).toHaveBeenCalledWith({ userExpertise: {} })
    expect(chalk.green).toHaveBeenCalledWith('Expertise levels have been successfully set and saved!')
  })

  it('should handle errors during the process', async () => {
    const mockError = new Error('Test error')
    vi.mocked(utils.readConfig).mockImplementation(() => { throw mockError })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await handler()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error setting user expertise levels:',
      mockError
    )
  })

  it('should display welcome messages', async () => {
    vi.mocked(inquirer.confirm).mockResolvedValue(false)
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await handler()

    expect(consoleLogSpy).toHaveBeenCalledWith('Welcome to the expertise assessment questionnaire!')
    expect(consoleLogSpy).toHaveBeenCalledWith('Please answer the following questions about your programming expertise.')
  })
})
