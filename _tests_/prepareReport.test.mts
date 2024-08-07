/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {handler} from '../commands/prepareReport.mjs'
import * as utils from '../utils.mjs'
import OpenAIInferrence from '../openai.mjs'
import ora from 'ora'

vi.mock('../utils.mjs')
vi.mock('../openai.mjs')
vi.mock('ora')

describe('prepareReport command', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should fail if no analysis is found', async () => {
    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir'})
    vi.mocked(utils.getAnalysis).mockReturnValue({})

    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      fail: vi.fn(),
    }
    vi.mocked(ora).mockReturnValue(mockSpinner as any)

    await handler({path: 'test-project', verbose: false, streaming: false} as any)

    expect(mockSpinner.fail).toHaveBeenCalledWith('No analysis found, Please run analyse command first')
  })

  it('should generate a report successfully', async () => {
    const mockAnalysis = {
      directoryStructure: 'mock directory structure',
      dependencyInference: 'mock dependency inference',
      codeInferrence: 'mock code inference',
    }
    const mockReport = 'Generated README content'

    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir'})
    vi.mocked(utils.getAnalysis).mockReturnValue(mockAnalysis)

    const mockOpenAI = {
      generateReadme: vi.fn().mockResolvedValue(mockReport),
    }
    vi.mocked(OpenAIInferrence).mockImplementation(() => mockOpenAI as any)

    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn(),
    }
    vi.mocked(ora).mockReturnValue(mockSpinner as any)

    await handler({path: 'test-project', verbose: false, streaming: false} as any)

    expect(mockOpenAI.generateReadme).toHaveBeenCalledWith(
      'mock directory structure',
      'mock dependency inference',
      'mock code inference',
      true,
      false,
      false
    )
    expect(mockSpinner.stopAndPersist).toHaveBeenCalledWith({symbol: '✔️', text: mockReport})
  })

  it('should handle streaming output', async () => {
    const mockAnalysis = {
      directoryStructure: 'mock directory structure',
      dependencyInference: 'mock dependency inference',
      codeInferrence: 'mock code inference',
    }
    const mockStreamChunks = [
      {choices: [{delta: {content: 'Chunk 1'}}]},
      {choices: [{delta: {content: 'Chunk 2'}}]},
    ]

    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir'})
    vi.mocked(utils.getAnalysis).mockReturnValue(mockAnalysis)

    const mockOpenAI = {
      generateReadme: vi.fn().mockResolvedValue(mockStreamChunks),
    }
    vi.mocked(OpenAIInferrence).mockImplementation(() => mockOpenAI as any)

    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      clear: vi.fn(),
    }
    vi.mocked(ora).mockReturnValue(mockSpinner as any)

    const mockStdout = {
      write: vi.fn(),
    }
    vi.spyOn(process.stdout, 'write').mockImplementation(mockStdout.write)

    await handler({path: 'test-project', verbose: false, streaming: true} as any)

    expect(mockOpenAI.generateReadme).toHaveBeenCalledWith(
      'mock directory structure',
      'mock dependency inference',
      'mock code inference',
      true,
      true,
      false
    )
    expect(mockSpinner.stop).toHaveBeenCalled()
    expect(mockSpinner.clear).toHaveBeenCalled()
    expect(mockStdout.write).toHaveBeenCalledWith('Chunk 1')
    expect(mockStdout.write).toHaveBeenCalledWith('Chunk 2')
    expect(mockStdout.write).toHaveBeenCalledWith('\n')
  })

  it('should handle verbose output', async () => {
    const mockAnalysis = {
      directoryStructure: 'mock directory structure',
      dependencyInference: 'mock dependency inference',
      codeInferrence: 'mock code inference',
    }
    const mockReport = 'Generated README content'

    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir'})
    vi.mocked(utils.getAnalysis).mockReturnValue(mockAnalysis)

    const mockOpenAI = {
      generateReadme: vi.fn().mockResolvedValue(mockReport),
    }
    vi.mocked(OpenAIInferrence).mockImplementation(() => mockOpenAI as any)

    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn(),
    }
    vi.mocked(ora).mockReturnValue(mockSpinner as any)

    const consoleSpy = vi.spyOn(console, 'log')

    await handler({path: 'test-project', verbose: true, streaming: false} as any)

    expect(consoleSpy).toHaveBeenCalledWith(expect.objectContaining({
      dirPath: expect.any(String),
      isProjectRoot: expect.any(Boolean),
    }))
    expect(consoleSpy).toHaveBeenCalledWith({
      analysis: ['directoryStructure', 'dependencyInference', 'codeInferrence'],
    })
    expect(consoleSpy).toHaveBeenCalledWith({
      directoryStructure: 'mock directory structure',
      dependencyInference: 'mock dependency inference',
      codeInference: 'mock code inference',
    })
  })
})
