import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {handler} from '../commands/listConfig.mjs'
import * as utils from '../utils.mjs'
import inquirer from 'inquirer'
import * as getExpertise from '../commands/getExpertise.mts'

vi.mock('../utils.mjs')
vi.mock('inquirer')
vi.mock('../commands/getExpertise.mts')

describe('listConfig command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log the config', async () => {
    const mockConfig = {
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo',
      storagePath: '/test/path'
    }

    vi.spyOn(utils, 'readConfig').mockReturnValue(mockConfig)
    const consoleSpy = vi.spyOn(console, 'log')

    await handler({
      _: [],
      $0: ""
    })

    expect(utils.readConfig).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('List all available Configs')
    expect(consoleSpy).toHaveBeenCalledWith(mockConfig)
  })

  it('should handle empty config', async () => {
    vi.spyOn(utils, 'readConfig').mockReturnValue({})
    const consoleSpy = vi.spyOn(console, 'log')

    await handler({
      _: [],
      $0: ""
    })

    expect(utils.readConfig).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('List all available Configs')
    expect(consoleSpy).toHaveBeenCalledWith({})
  })

  it('should handle errors when reading config', async () => {
    vi.spyOn(utils, 'readConfig').mockImplementation(() => {
      throw new Error('Failed to read config')
    })
    const consoleSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi.spyOn(console, 'error')

    await handler({
      _: [],
      $0: ""
    })

    expect(utils.readConfig).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('List all available Configs')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading config:', expect.any(Error))
  })

  it('should prompt user to set expertise level if not set', async () => {
    const mockConfig = {
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo',
      storagePath: '/test/path'
    }

    vi.spyOn(utils, 'readConfig').mockReturnValue(mockConfig)
    vi.mocked(inquirer.prompt).mockResolvedValue({ setExpertise: true })
    const getExpertiseHandlerSpy = vi.spyOn(getExpertise, 'handler').mockResolvedValue()

    await handler({
      _: [],
      $0: ""
    })

    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'confirm',
        name: 'setExpertise',
        message: 'Your expertise level is not set. Would you like to set it now?',
        default: true,
      },
    ])
    expect(getExpertiseHandlerSpy).toHaveBeenCalled()
  })

  it('should not prompt user to set expertise level if already set', async () => {
    const mockConfig = {
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo',
      storagePath: '/test/path',
      expertise: 'Intermediate'
    }

    vi.spyOn(utils, 'readConfig').mockReturnValue(mockConfig)
    const consoleSpy = vi.spyOn(console, 'log')

    await handler({
      _: [],
      $0: ""
    })

    expect(inquirer.prompt).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('List all available Configs')
    expect(consoleSpy).toHaveBeenCalledWith(mockConfig)
  })
})
