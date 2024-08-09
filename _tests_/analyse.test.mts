/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {handler} from '../commands/analyse.mjs'
import * as directoryProcessor from '../directoryProcessor.mjs'
import * as openai from '../openai.mjs'
import * as utils from '../utils.mjs'
import fs from 'fs'
import ora from 'ora'

vi.mock('../directoryProcessor.mjs')
vi.mock('../openai.mjs')
vi.mock('../utils.mjs')
vi.mock('fs')
vi.mock('ora')

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

    await handler(mockArgv as any)

    expect(directoryProcessor.getDirStructure).toHaveBeenCalledWith('/test/project', [], false)
    expect(utils.writeAnalysis).toHaveBeenCalledTimes(5) // directoryStructure, directoryStructureWithFileContent, directoryInference, codeInference, dependencyInference
    expect(utils.addAnalysisInGitIgnore).not.toHaveBeenCalled()
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
})
