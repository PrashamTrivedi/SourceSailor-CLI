import {describe, it, expect, vi} from 'vitest'
import {handler} from '../commands/listConfig.mjs'
import * as utils from '../utils.mjs'

vi.mock('../utils.mjs')

describe('listConfig command', () => {
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
})
