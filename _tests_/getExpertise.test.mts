import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { handler } from '../commands/getExpertise.mts'

vi.mock('fs')
vi.mock('os')
vi.mock('path')

describe('getExpertise command', () => {
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

  it('should display the current expertise level', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log')

    await handler({ _: [], $0: '' })

    expect(consoleLogSpy).toHaveBeenCalledWith('Your current expertise level is Intermediate')
  })

  it('should display a message if expertise level is not set', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}))

    const consoleLogSpy = vi.spyOn(console, 'log')

    await handler({ _: [], $0: '' })

    expect(consoleLogSpy).toHaveBeenCalledWith('Expertise level is not set. Please run the setExpertise command to set it.')
  })

  it('should handle errors when parsing the config file', async () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('File read error')
    })
    const consoleErrorSpy = vi.spyOn(console, 'error')

    await handler({ _: [], $0: '' })

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error parsing config file:', expect.any(Error))
  })
})
