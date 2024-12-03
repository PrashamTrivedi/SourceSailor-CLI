/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {handler} from '../commands/prepareReport.mjs'
import * as utils from '../utils.mjs'
import ModelUtils from '../modelUtils.mjs'
import ora from 'ora'
import * as inquirer from '@inquirer/prompts'
import * as setExpertise from '../commands/setExpertise.mjs'

vi.mock('../utils.mjs')
vi.mock('../modelUtils.mjs', () => {
  return {
    default: {
      getInstance: vi.fn().mockReturnValue({
        initializeModels: vi.fn().mockResolvedValue(undefined),
        getLlmInterface: vi.fn().mockReturnValue({
          getName: vi.fn().mockReturnValue('Mocked model'),
          generateReadme: vi.fn().mockResolvedValue('Generated README content'),
        }),
      }),
    },
  }
})
vi.mock('ora')
vi.mock('@inquirer/prompts')
vi.mock('../commands/setExpertise.mjs')

describe('prepareReport command', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(inquirer.confirm).mockResolvedValue(false)
    vi.mocked(setExpertise.handler).mockResolvedValue(undefined)
    // Add mock for process.cwd
    const mockCwd = vi.spyOn(process, 'cwd')
    mockCwd.mockReturnValue('/test/current-project')
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.restoreAllMocks() // Add this to cleanup process.cwd mock
  })

  it('should fail if no analysis is found', async () => {
    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir', DEFAULT_OPENAI_MODEL: 'test-model'})
    vi.mocked(utils.getAnalysis).mockReturnValue({})

    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      fail: vi.fn(),
    }
    vi.mocked(ora).mockReturnValue(mockSpinner as any)

    const mockModelUtils = {
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getLlmInterface: vi.fn().mockReturnValue({
        getName: vi.fn().mockReturnValue('Mocked model'),
        generateReadme: vi.fn().mockResolvedValue(null),
      }),
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue(mockModelUtils as any)

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

    const mockModelUtils = {
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getLlmInterface: vi.fn().mockReturnValue({
        getName: vi.fn().mockReturnValue('Mocked model'),
        generateReadme: vi.fn().mockResolvedValue(mockReport),
      }),
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue(mockModelUtils as any)

    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn(),
    }
    vi.mocked(ora).mockReturnValue(mockSpinner as any)

    await handler({path: 'test-project', verbose: false, streaming: false} as any)

    expect(mockModelUtils.getLlmInterface().generateReadme).toHaveBeenCalledWith(
      'mock directory structure',
      'mock dependency inference',
      'mock code inference',
      false,
      false,
      undefined,
      undefined
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
      'Chunk 1',
      'Chunk 2',
    ]

    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir'})
    vi.mocked(utils.getAnalysis).mockReturnValue(mockAnalysis)

    const mockModelUtils = {
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getLlmInterface: vi.fn().mockReturnValue({
        getName: vi.fn().mockReturnValue('Mocked model'),
        generateReadme: vi.fn().mockResolvedValue(mockStreamChunks),
      }),
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue(mockModelUtils as any)

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

    expect(mockModelUtils.getLlmInterface().generateReadme).toHaveBeenCalledWith(
      'mock directory structure',
      'mock dependency inference',
      'mock code inference',
      true,
      false,
      undefined,
      undefined
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

    const mockModelUtils = {
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getLlmInterface: vi.fn().mockReturnValue({
        getName: vi.fn().mockReturnValue('Mocked model'),
        generateReadme: vi.fn().mockResolvedValue(mockReport),
      }),
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue(mockModelUtils as any)

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

  it('should prompt for user expertise if not set', async () => {
    const mockAnalysis = {
      directoryStructure: 'mock directory structure',
      dependencyInference: 'mock dependency inference',
      codeInferrence: 'mock code inference',
    }
    const mockReport = 'Generated README content'

    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir'})
    vi.mocked(utils.getAnalysis).mockReturnValue(mockAnalysis)

    const mockModelUtils = {
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getLlmInterface: vi.fn().mockReturnValue({
        getName: vi.fn().mockReturnValue('Mocked model'),
        generateReadme: vi.fn().mockResolvedValue(mockReport),
      }),
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue(mockModelUtils as any)

    vi.mocked(ora).mockReturnValue({
      start: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn(),
    } as any)
    vi.mocked(inquirer.confirm).mockResolvedValue(true)

    await handler({path: 'test-project', verbose: false, streaming: false} as any)

    expect(inquirer.confirm).toHaveBeenCalledWith({
      message: "Would you like to set your expertise now?",
      default: true
    })
    expect(setExpertise.handler).toHaveBeenCalled()
  })

  it('should not prompt for user expertise if already set', async () => {
    const mockAnalysis = {
      directoryStructure: 'mock directory structure',
      dependencyInference: 'mock dependency inference',
      codeInferrence: 'mock code inference',
    }
    const mockReport = 'Generated README content'

    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: 'test-dir', userExpertise: 'intermediate'})
    vi.mocked(utils.getAnalysis).mockReturnValue(mockAnalysis)
    const mockModelUtils = {
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getLlmInterface: vi.fn().mockReturnValue({
        getName: vi.fn().mockReturnValue('Mocked model'),
        generateReadme: vi.fn().mockResolvedValue(mockReport),
      }),
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue(mockModelUtils as any)
    vi.mocked(ora).mockReturnValue({
      start: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn(),
    } as any)

    await handler({path: 'test-project', verbose: false, streaming: false} as any)

    expect(inquirer.confirm).not.toHaveBeenCalled()
    expect(setExpertise.handler).not.toHaveBeenCalled()
  })

  it('should handle current directory analysis correctly', async () => {
    const mockAnalysis = {
      directoryStructure: 'mock directory structure',
      dependencyInference: 'mock dependency inference',
      codeInferrence: 'mock code inference',
    }
    const mockReport = 'Generated README content'

    // Mock config with a specific ANALYSIS_DIR
    vi.mocked(utils.readConfig).mockReturnValue({
      ANALYSIS_DIR: '/test/analysis',
      DEFAULT_OPENAI_MODEL: 'test-model'
    })
    vi.mocked(utils.getAnalysis).mockReturnValue(mockAnalysis)
    const mockModelUtils = {
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getLlmInterface: vi.fn().mockReturnValue({
        getName: vi.fn().mockReturnValue('Mocked model'),
        generateReadme: vi.fn().mockResolvedValue(mockReport),
      }),
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue(mockModelUtils as any)

    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn(),
    }
    vi.mocked(ora).mockReturnValue(mockSpinner as any)

    const consoleSpy = vi.spyOn(console, 'log')

    await handler({path: '.', verbose: true} as any)

    // Verify the analysis path is constructed correctly
    // When processing current directory, it should be rootDir/.SourceSailor/current-project
    expect(utils.getAnalysis).toHaveBeenCalledWith(
      '/test/analysis/.SourceSailor/current-project',
      false  // isProjectRoot should be false for current directory
    )

    // Verify that if verbose is enabled, we log the correct path
    expect(consoleSpy).toHaveBeenCalledWith({
      dirPath: '/test/analysis/.SourceSailor/current-project',
      isProjectRoot: false,
      projectDir: '.'
    })

    // Verify the report generation
    expect(mockModelUtils.getLlmInterface().generateReadme).toHaveBeenCalledWith(
      'mock directory structure',
      'mock dependency inference',
      'mock code inference',
      false,
      true,
      undefined,
      "test-model"
    )

    // Verify writing the analysis uses the correct path
    expect(utils.writeAnalysis).toHaveBeenCalledWith(
      '/test/analysis/.SourceSailor/current-project',
      'inferredReadme',
      mockReport,
      false  // isProjectRoot should be false
    )

    consoleSpy.mockRestore()
  })
})
