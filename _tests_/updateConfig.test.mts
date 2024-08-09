import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { handler } from '../commands/updateConfig.mjs'

vi.mock('fs')
vi.mock('os')
vi.mock('path')

describe('updateConfig', () => {
  const mockHomeDir = '/mock/home'
  const mockConfigPath = '/mock/home/.SourceSailor/config.json'
  const mockConfigData = {
    OPENAI_API_KEY: 'old-api-key',
    DEFAULT_OPENAI_MODEL: 'old-model',
    ANALYSIS_DIR: 'old-analysis-dir'
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(os.homedir).mockReturnValue(mockHomeDir)
    vi.mocked(path.join).mockReturnValue(mockConfigPath)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfigData))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should update API key when provided', () => {
    const argv = { apiKey: 'new-api-key', _: [], $0: '' }
    handler(argv)

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockConfigPath,
      JSON.stringify({ ...mockConfigData, OPENAI_API_KEY: 'new-api-key' })
    )
  })

  it('should update model when provided', () => {
    const argv = { model: 'new-model', _: [], $0: '' }
    handler(argv)

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockConfigPath,
      JSON.stringify({ ...mockConfigData, DEFAULT_OPENAI_MODEL: 'new-model' })
    )
  })

  it('should update analysis directory when provided', () => {
    const argv = { analysisDir: 'new-analysis-dir', _: [], $0: '' }
    handler(argv)

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockConfigPath,
      JSON.stringify({ ...mockConfigData, ANALYSIS_DIR: 'new-analysis-dir' })
    )
  })

  it('should update multiple settings when provided', () => {
    const argv = { apiKey: 'new-api-key', model: 'new-model', analysisDir: 'new-analysis-dir', _: [], $0: '' }
    handler(argv)

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockConfigPath,
      JSON.stringify({
        OPENAI_API_KEY: 'new-api-key',
        DEFAULT_OPENAI_MODEL: 'new-model',
        ANALYSIS_DIR: 'new-analysis-dir'
      })
    )
  })

  it('should not modify config when no arguments are provided', () => {
    const argv = { _: [], $0: '' }
    handler(argv)

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockConfigPath,
      JSON.stringify(mockConfigData)
    )
  })

  it('should handle file system errors', () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('File read error')
    })

    const argv = { apiKey: 'new-api-key', _: [], $0: '' }
    
    expect(() => handler(argv)).toThrow('File read error')
  })
})
