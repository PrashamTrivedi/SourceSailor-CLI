// @ts-nocheck
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {readConfig, addAnalysisInGitIgnore, writeAnalysis, writeError, getAnalysis} from '../utils.mjs'
import fs from 'fs'
import path from 'path'

vi.mock('fs')
vi.mock('path')

const mockProjectStructure = {
  'project-root': {
    '.gitignore': '',
    'src': {
      'index.js': 'console.log("Hello, world!");',
      'utils': {
        'helper.js': 'function helper() { return "I\'m helping!"; }'
      }
    },
    'package.json': '{ "name": "test-project", "version": "1.0.0" }',
    '.SourceSailor': {
      'analysis': {
        'dependency-analysis.json': '{ "dependencies": {} }',
        'code-analysis.md': '# Code Analysis\n\nThis is a mock analysis.'
      }
    }
  }
}

function setupMockFileSystem() {
  const mockFs = {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn()
  }

  function mockFsTraversal(structure, currentPath = '') {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(currentPath, name)
      if (typeof content === 'string') {
        mockFs.existsSync.mockImplementation((path) => path === fullPath ? true : false)
        mockFs.readFileSync.mockImplementation((path, _) => path === fullPath ? content : '')
      } else if (typeof content === 'object') {
        mockFs.existsSync.mockImplementation((path) => path === fullPath ? true : false)
        mockFs.readdirSync.mockImplementation((path) => path === fullPath ? Object.keys(content) : [])
        mockFs.statSync.mockImplementation((path) => ({
          isDirectory: () => path === fullPath
        }))
        mockFsTraversal(content, fullPath)
      }
    }
  }

  mockFsTraversal(mockProjectStructure)
  vi.spyOn(fs, 'existsSync').mockImplementation(mockFs.existsSync)
  vi.spyOn(fs, 'readFileSync').mockImplementation(mockFs.readFileSync)
  vi.spyOn(fs, 'writeFileSync').mockImplementation(mockFs.writeFileSync)
  vi.spyOn(fs, 'appendFileSync').mockImplementation(mockFs.appendFileSync)
  vi.spyOn(fs, 'mkdirSync').mockImplementation(mockFs.mkdirSync)
  vi.spyOn(fs, 'readdirSync').mockImplementation(mockFs.readdirSync)
  vi.spyOn(fs, 'statSync').mockImplementation(mockFs.statSync)
}

beforeEach(() => {
  setupMockFileSystem()
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('readConfig', () => {
  it('should return an empty object when config file doesn\'t exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const config = readConfig()
    expect(config).toEqual({})
  })

  it('should return the correct config when file exists', () => {
    const mockConfig = {OPENAI_API_KEY: 'test-key', DEFAULT_OPENAI_MODEL: 'gpt-3.5-turbo'}
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig))
    const config = readConfig()
    expect(config).toEqual(mockConfig)
  })

  it('should handle JSON parsing errors', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('invalid json')
    const config = readConfig()
    expect(config).toEqual({})
  })
})

describe('addAnalysisInGitIgnore', () => {
  it('should add .SourceSailor/analysis to .gitignore if it doesn\'t exist', () => {
    const mockGitignoreContent = 'node_modules\n'
    const mockGitignorePath = '/mock/project-root/.gitignore'
    vi.spyOn(path, 'join').mockReturnValue(mockGitignorePath)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockGitignoreContent)
    const appendSpy = vi.spyOn(fs, 'appendFileSync')

    addAnalysisInGitIgnore('/mock/project-root')

    expect(appendSpy).toHaveBeenCalledWith(
      mockGitignorePath,
      '\n.SourceSailor/analysis'
    )
  })

  it('should not add duplicate entries if .SourceSailor/analysis already exists', () => {
    const mockGitignoreContent = 'node_modules\n.SourceSailor/analysis\n'
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockGitignoreContent)
    const appendSpy = vi.spyOn(fs, 'appendFileSync')

    addAnalysisInGitIgnore('project-root')

    expect(appendSpy).not.toHaveBeenCalled()
  })

  it('should not create .gitignore if it doesn\'t exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const writeSpy = vi.spyOn(fs, 'writeFileSync')
    const appendSpy = vi.spyOn(fs, 'appendFileSync')

    addAnalysisInGitIgnore('project-root')

    expect(writeSpy).not.toHaveBeenCalled()
    expect(appendSpy).not.toHaveBeenCalled()
  })
})

describe('writeAnalysis', () => {
  const mockProjectRoot = '/mock/project-root'

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined)
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => { })
    vi.spyOn(path, 'join').mockImplementation((...args) => args.join('/'))
  })

  it('should create analysis directory if it doesn\'t exist', () => {
    writeAnalysis(mockProjectRoot, 'test-analysis', 'Test content')
    expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/project-root/analysis', {recursive: true})
  })

  it('should write JSON file correctly', () => {
    const analysisContent = {key: 'value'}
    writeAnalysis(mockProjectRoot, 'test-json', analysisContent, true)
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/mock/project-root/analysis/test-json.json',
      JSON.stringify(analysisContent, null, 4)
    )
  })

  it('should write markdown file correctly', () => {
    const analysisContent = '# Test Markdown'
    writeAnalysis(mockProjectRoot, 'test-md', analysisContent)
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/mock/project-root/analysis/test-md.md',
      analysisContent
    )
  })

  it('should use project root for analysis directory when isProjectRoot is true', () => {
    writeAnalysis(mockProjectRoot, 'test-root', 'Test content', false, true)
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      '/mock/project-root/.SourceSailor/analysis',
      {recursive: true}
    )
  })

  it('should handle errors in file writing', () => {
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('Write error')
    })
    expect(() => writeAnalysis(mockProjectRoot, 'error-test', 'Test content')).toThrow('Write error')
  })
})

describe('writeError', () => {
  const mockProjectRoot = '/mock/project-root'
  const mockErrorDir = '/mock/project-root/errors'
  const mockErrorFile = '/mock/project-root/errors/test-error.txt'

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(path, 'join')
      .mockImplementationOnce(() => mockErrorDir)
      .mockImplementationOnce(() => mockErrorFile)
  })

  it('should create error directory if it doesn\'t exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const mkdirSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined)
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined)

    writeError(mockProjectRoot, 'test-error', 'Error content', 'Error message')

    expect(mkdirSpy).toHaveBeenCalledWith(mockErrorDir, {recursive: true})
  })

  it('should not create error directory if it already exists', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    const mkdirSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined)
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined)

    writeError(mockProjectRoot, 'test-error', 'Error content', 'Error message')

    expect(mkdirSpy).not.toHaveBeenCalled()
  })

  it('should write error file correctly', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined)

    writeError(mockProjectRoot, 'test-error', 'Error content', 'Error message')

    expect(writeSpy).toHaveBeenCalledWith(
      mockErrorFile,
      'Error content\n\nError message'
    )
  })

  it('should handle errors in file writing', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('Write error')
    })

    expect(() => writeError(mockProjectRoot, 'test-error', 'Error content', 'Error message'))
      .toThrow('Write error')
  })
})

describe('getAnalysis', () => {
  const mockProjectRoot = '/mock/project-root'

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(path, 'join').mockImplementation((...args) => args.join('/'))
    vi.spyOn(path, 'basename').mockImplementation((p) => {
      if (typeof p === 'string') {
        return p.split('/').pop() || ''
      }
      return p.toString().split('/').pop() || ''
    })
    vi.spyOn(path, 'extname').mockImplementation((p) => {
      if (typeof p === 'string') {
        const parts = p.split('.')
        return parts.length > 1 ? '.' + parts.pop() : ''
      }
      return ''
    })
  })

  it('should return an empty object if analysis directory doesn\'t exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)

    const result = getAnalysis(mockProjectRoot, false)

    expect(result).toEqual({})
  })

  it('should correctly read and return analysis files', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['file1.json', 'file2.md'])
    vi.spyOn(fs, 'statSync').mockReturnValue({
      isDirectory: () => false
    } as fs.Stats)
    vi.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce('{"key": "value"}')
      .mockReturnValueOnce('# Markdown content')

    const result = getAnalysis(mockProjectRoot, false)

    expect(result).toEqual({
      'file1.json': '{"key": "value"}',
      'file2.md': '# Markdown content'
    })
  })

  it('should handle nested directories in analysis', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync')
      .mockReturnValueOnce(['file1.json', 'nested'])
      .mockReturnValueOnce(['file2.md'])
    vi.spyOn(fs, 'statSync')
      .mockReturnValueOnce({
        isDirectory: () => false
      } as fs.Stats)
      .mockReturnValueOnce({
        isDirectory: () => true
      } as fs.Stats)
      .mockReturnValueOnce({
        isDirectory: () => false
      } as fs.Stats)
    vi.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce('{"key": "value"}')
      .mockReturnValueOnce('# Nested content')

    const result = getAnalysis(mockProjectRoot, false)

    expect(result).toEqual({
      'file1.json': '{"key": "value"}',
      nested: {
        'file2.md': '# Nested content'
      }
    })
  })

  it('should handle both JSON and markdown files', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['file1.json', 'file2.md'])
    vi.spyOn(fs, 'statSync').mockReturnValue({
      isDirectory: () => false
    } as fs.Stats)
    vi.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce('{"key": "value"}')
      .mockReturnValueOnce('# Markdown content')

    const result = getAnalysis(mockProjectRoot, false)

    expect(result).toEqual({
      'file1.json': '{"key": "value"}',
      'file2.md': '# Markdown content'
    })
  })

  it('should use .SourceSailor/analysis directory when isProjectRoot is true', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['file1.json'])
    vi.spyOn(fs, 'statSync').mockReturnValue({
      isDirectory: () => false
    } as fs.Stats)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{"key": "value"}')

    getAnalysis(mockProjectRoot, true)

    expect(path.join).toHaveBeenCalledWith(mockProjectRoot, '.SourceSailor', 'analysis')
  })
})
