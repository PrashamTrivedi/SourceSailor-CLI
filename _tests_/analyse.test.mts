/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {handler} from '../commands/analyse.mjs'
import * as directoryProcessor from '../directoryProcessor.mjs'
import ModelUtils from '../modelUtils.mjs'
import * as utils from '../utils.mjs'
import fs from 'fs'
import ora from 'ora'
import * as inquirer from '@inquirer/prompts'
import * as setExpertise from '../commands/setExpertise.mjs'

vi.mock('../directoryProcessor.mjs')
vi.mock('../modelUtils.mjs')
vi.mock('../utils.mjs')
vi.mock('fs')
vi.mock('ora')
vi.mock('@inquirer/prompts')
vi.mock('../commands/setExpertise.mjs')

describe('analyse command', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(ora).mockReturnValue({
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn().mockReturnThis(),
      text: '',
    } as any)
    vi.mocked(inquirer.confirm).mockResolvedValue(false)
    vi.mocked(setExpertise.handler).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should analyze a non-monorepo project correctly', async () => {
    const mockArgv = {
      path: '/test/project',
      verbose: false,
      openai: true,
      streaming: false,
      ignore: [],
    }

    const mockDirectoryStructure = {
      name: 'project',
      children: [
        {name: 'src', children: []},
        {name: 'package.json', content: '{}'},
      ],
    }

    const mockDirectoryInference = {
      isMonorepo: false,
      workflow: 'nodejs',
      dependenciesFile: 'package.json',
      programmingLanguage: 'javascript',
    }

    vi.mocked(directoryProcessor.getDirStructure).mockResolvedValue(mockDirectoryStructure as any)
    const mockModelUtils = {
      getInstance: vi.fn().mockReturnValue({
        initializeModels: vi.fn().mockResolvedValue(undefined),
        getModelForName: vi.fn().mockReturnValue({
          inferProjectDirectory: vi.fn().mockResolvedValue(JSON.stringify(mockDirectoryInference)),
          inferCode: vi.fn().mockResolvedValue('Mocked code inference'),
          inferInterestingCode: vi.fn().mockResolvedValue('Mocked interesting code'),
          inferDependency: vi.fn().mockResolvedValue('Mocked dependency inference'),
        }),
      }),
    }
    vi.mocked(ModelUtils).mockImplementation(() => mockModelUtils as any)
    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: '/test', userExpertise: 'intermediate'} as any)
    vi.mocked(fs.readFileSync).mockReturnValue('{}')

    await handler(mockArgv as any)

    expect(directoryProcessor.getDirStructure).toHaveBeenCalledWith('/test/project', [], false)
    expect(utils.writeAnalysis).toHaveBeenCalledTimes(5) // directoryStructure, directoryStructureWithFileContent, directoryInference, codeInference, dependencyInference
    expect(utils.addAnalysisInGitIgnore).not.toHaveBeenCalled()
  })

  it('should stop analysis if programming language is not defined for non-monorepo project', async () => {
    const mockArgv = {
      path: '/test/project',
      verbose: false,
      openai: true,
      streaming: false,
      ignore: [],
    }

    const mockDirectoryStructure = {
      name: 'project',
      children: [
        {name: 'src', children: []},
        {name: 'package.json', content: '{}'},
      ],
    }

    const mockDirectoryInference = {
      isMonorepo: false,
      workflow: 'nodejs',
      dependenciesFile: 'package.json',
      // No programming language defined
    }

    vi.mocked(directoryProcessor.getDirStructure).mockResolvedValue(mockDirectoryStructure as any)
    vi.mocked(openai.default).mockReturnValue({
      inferProjectDirectory: vi.fn().mockResolvedValue(JSON.stringify(mockDirectoryInference)),
    } as any)
    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: '/test'} as any)
    vi.mocked(fs.readFileSync).mockReturnValue('{}')

    await expect(handler(mockArgv as any)).rejects.toThrow('Programming language not defined for non-monorepo project')

    expect(directoryProcessor.getDirStructure).toHaveBeenCalledWith('/test/project', [], false)
    expect(utils.writeAnalysis).toHaveBeenCalledTimes(3) // directoryStructure, directoryStructureWithFileContent, directoryInference
    expect(utils.writeError).toHaveBeenCalledWith(expect.anything(), 'Analysis', expect.stringContaining('Programming language not defined for non-monorepo project'), expect.anything())
  })

  it('should analyze a monorepo project correctly', async () => {
    const mockArgv = {
      path: '/test/monorepo',
      verbose: true,
      openai: true,
      streaming: false,
      ignore: ['node_modules'],
    }

    const mockDirectoryStructure = {
      name: 'monorepo',
      children: [
        {name: 'package1', children: [{name: 'package.json', content: '{}'}]},
        {name: 'package2', children: [{name: 'package.json', content: '{}'}]},
      ],
    }

    const mockDirectoryInference = {
      isMonorepo: true,
      workflow: 'nodejs',
      directories: ['package1', 'package2'],
    }

    vi.mocked(directoryProcessor.getDirStructure).mockResolvedValue(mockDirectoryStructure as any)
    vi.mocked(openai.default).mockReturnValue({
      inferProjectDirectory: vi.fn().mockResolvedValue(JSON.stringify(mockDirectoryInference)),
      inferCode: vi.fn().mockResolvedValue('Mocked code inference'),
      inferInterestingCode: vi.fn().mockResolvedValue('Mocked interesting code'),
      inferDependency: vi.fn().mockResolvedValue('Mocked dependency inference'),
    } as any)
    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: '/test'} as any)
    vi.mocked(fs.readFileSync).mockReturnValue('{}')

    const callsBeforeInferringMonoRepo = 3
    const callsForInferringCallsPerMonorepo = 2
    const writeAnalysisCalls = callsBeforeInferringMonoRepo + (callsForInferringCallsPerMonorepo * (mockDirectoryStructure.children.length))
    await handler(mockArgv as any)

    expect(directoryProcessor.getDirStructure).toHaveBeenCalledWith('/test/monorepo', ['node_modules'], true)
    expect(utils.writeAnalysis).toHaveBeenCalledTimes(writeAnalysisCalls)
    // 3 calls before we 
    expect(utils.addAnalysisInGitIgnore).not.toHaveBeenCalled()
  })

  it('should handle errors during analysis', async () => {
    const mockArgv = {
      path: '/test/error-project',
      verbose: true,
      openai: true,
      streaming: false,
      ignore: [],
    }

    const mockDirectoryStructure = {
      name: 'error-project',
      children: [
        {name: 'src', children: []},
        {name: 'package.json', content: '{}'},
      ],
    }

    const mockDirectoryInference = {
      isMonorepo: false,
      workflow: 'nodejs',
      dependenciesFile: 'package.json',
      programmingLanguage: 'javascript',
    }

    vi.mocked(directoryProcessor.getDirStructure).mockResolvedValue(mockDirectoryStructure as any)
    vi.mocked(openai.default).mockReturnValue({
      inferProjectDirectory: vi.fn().mockResolvedValue(JSON.stringify(mockDirectoryInference)),
      inferCode: vi.fn().mockRejectedValue(new Error('Mocked error')),
      inferInterestingCode: vi.fn().mockRejectedValue(new Error('Mocked error')),
      inferDependency: vi.fn().mockResolvedValue('Mocked dependency inference'),
    } as any)
    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: '/test'} as any)
    vi.mocked(fs.readFileSync).mockReturnValue('{}')

    await handler(mockArgv as any)

    expect(directoryProcessor.getDirStructure).toHaveBeenCalledWith('/test/error-project', [], true)
    expect(utils.writeAnalysis).toHaveBeenCalledTimes(5) // directoryStructure, directoryStructureWithFileContent, directoryInference, codeInference (with error), dependencyInference
    expect(utils.writeAnalysis).toHaveBeenCalledWith(
      expect.anything(),
      'codeInferrence',
      expect.stringContaining('Error inferring code: Mocked error'),
      expect.anything(),
      expect.anything()
    )
    expect(utils.writeAnalysis).toHaveBeenCalledWith(
      expect.anything(),
      'codeInferrence',
      expect.stringContaining('Error inferring interesting code: Mocked error'),
      expect.anything(),
      expect.anything()
    )
    expect(utils.writeError).not.toHaveBeenCalled()
  })

  it('should prompt for user expertise if not set', async () => {
    const mockArgv = {
      path: '/test/project',
      verbose: false,
      openai: true,
      streaming: false,
      ignore: [],
    }

    const mockDirectoryStructure = {
      name: 'project',
      children: [
        {name: 'src', children: []},
        {name: 'package.json', content: '{}'},
      ],
    }

    const mockDirectoryInference = {
      isMonorepo: false,
      workflow: 'nodejs',
      dependenciesFile: 'package.json',
      programmingLanguage: 'javascript',
    }

    vi.mocked(directoryProcessor.getDirStructure).mockResolvedValue(mockDirectoryStructure as any)
    vi.mocked(openai.default).mockReturnValue({
      inferProjectDirectory: vi.fn().mockResolvedValue(JSON.stringify(mockDirectoryInference)),
      inferCode: vi.fn().mockResolvedValue('Mocked code inference'),
      inferInterestingCode: vi.fn().mockResolvedValue('Mocked interesting code'),
      inferDependency: vi.fn().mockResolvedValue('Mocked dependency inference'),
    } as any)
    vi.mocked(utils.readConfig).mockReturnValue({ANALYSIS_DIR: '/test'} as any)
    vi.mocked(fs.readFileSync).mockReturnValue('{}')
    vi.mocked(inquirer.confirm).mockResolvedValue(true)

    await handler(mockArgv as any)

    expect(inquirer.confirm).toHaveBeenCalledWith({
      message: "Would you like to set your expertise now?",
      default: true
    })
    expect(setExpertise.handler).toHaveBeenCalled()
  })
})
