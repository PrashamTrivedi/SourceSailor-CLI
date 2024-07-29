// @ts-nocheck
import {describe, it, expect, vi} from 'vitest'
import {getDirStructure} from '../directoryProcessor.mjs'
import fs, {PathLike} from 'fs'
import ignore from 'ignore'

vi.mock('fs')
vi.mock('ignore')

describe('directoryProcessor', () => {
  describe('getDirStructure', () => {
    it('should return undefined for ignored directories', async () => {
      const mockStructure = {
        'root': {
          'node_modules': {
            'package': {
              'index.js': 'module.exports = {};',
            },
          },
        },
      }

      setupMocks(mockStructure)

      const result = await getDirStructure('root/node_modules', [])
      expect(result).toBeUndefined()
    })

    it('should handle .gitignore file correctly', async () => {
      const mockStructure = {
        'root': {
          '.gitignore': 'node_modules\n*.log',
          'file1.txt': 'content of file1',
          'file2.js': 'console.log("Hello");',
          'debug.log': 'debug info',
          'node_modules': {
            'package': {
              'index.js': 'module.exports = {};',
            },
          },
        },
      }

      setupMocks(mockStructure)

      const result = await getDirStructure('root', [], true)
      expect(result?.children).not.toContainEqual(expect.objectContaining({name: 'node_modules'}))
      expect(result?.children).not.toContainEqual(expect.objectContaining({name: 'debug.log'}))
      expect(result?.children).toContainEqual(expect.objectContaining({name: '.gitignore'}))
      expect(result?.children).toContainEqual(expect.objectContaining({name: 'file1.txt'}))
      expect(result?.children).toContainEqual(expect.objectContaining({name: 'file2.js'}))
      expect(result?.children).toHaveLength(3)
    })

    it('should handle additional ignore paths', async () => {
      const mockStructure = {
        'root': {
          '.gitignore': 'node_modules\n*.log',
          'file1.txt': 'content of file1',
          'file2.js': 'console.log("Hello");',
          'file3.js': 'console.log("Hello");',
          'ignored_dir': {
            'ignored_file.txt': 'should be ignored',
          },
        },
      }

      setupMocks(mockStructure)

      const result = await getDirStructure('root', ['ignored_dir/', 'file3.js'], true)

      expect(result?.children).not.toContainEqual(expect.objectContaining({name: 'ignored_dir'}))
      expect(result?.children).not.toContainEqual(expect.objectContaining({name: 'file3.js'}))
      expect(result?.children).toContainEqual(expect.objectContaining({name: 'file1.txt'}))
      expect(result?.children).toContainEqual(expect.objectContaining({name: 'file2.js'}))
      expect(result?.children).toContainEqual(expect.objectContaining({name: '.gitignore'}))
    })

    it('should process directory structure correctly', async () => {
      const mockStructure = {
        'root': {
          'file1.txt': 'content of file1',
          'file2.js': 'console.log("Hello");',
          'subdir': {
            'subfile1.txt': 'content of subfile1',
          },
        },
      }

      setupMocks(mockStructure)

      const result = await getDirStructure('root', [])
      expect(result).toEqual(expect.objectContaining({
        name: 'root',
        content: null,
        children: expect.arrayContaining([
          expect.objectContaining({name: 'file1.txt', content: 'content of file1'}),
          expect.objectContaining({name: 'file2.js', content: 'console.log("Hello");'}),
          expect.objectContaining({
            name: 'subdir',
            content: null,
            children: expect.arrayContaining([
              expect.objectContaining({name: 'subfile1.txt', content: 'content of subfile1'})
            ])
          })
        ])
      }))
    })

    // Add more tests here...

  })
})

function setupMocks(mockStructure: any) {
  vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
    return pathExists(mockStructure, path)
  })

  vi.mocked(fs.readFileSync).mockImplementation((path: PathLike) => {
    return getFileContent(mockStructure, path)
  })

  vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
    return getDirectoryContents(mockStructure, path)
  })

  vi.mocked(fs.statSync).mockImplementation((path: PathLike) => {
    return {
      isDirectory: () => isDirectory(mockStructure, path),
    } as fs.Stats
  })

  vi.mocked(ignore.default).mockImplementation(() => {
    const ignoredPaths = new Set<string>()
    ignoredPaths.add('node_modules') // Always ignore node_modules
    const ig = {
      add: (patterns: string | string[]) => {
        if (typeof patterns === 'string') {
          patterns = patterns.split('\n')
        }
        patterns.forEach(pattern => {
          pattern = pattern.trim()
          if (pattern && !pattern.startsWith('#')) {
            ignoredPaths.add(pattern)
          }
        })
        return ig
      },
      ignores: (path: string) => {
        if (path.includes('node_modules')) return true // Explicitly ignore any path containing node_modules
        return Array.from(ignoredPaths).some(ignoredPath => {
          if (ignoredPath.endsWith('/')) {
            return path.startsWith(ignoredPath) || path === ignoredPath.slice(0, -1)
          }
          return path === ignoredPath || path.startsWith(`${ignoredPath}/`)
        })
      }
    }
    return ig
  })
}

function pathExists(structure: any, path: PathLike): boolean {
  const parts = path.toString().split('/').filter(p => p !== '')
  let current = structure
  for (const part of parts) {
    if (current[part] === undefined) return false
    current = current[part]
  }
  return true
}

function getFileContent(structure: any, path: PathLike): string {
  const parts = path.split('/').filter(p => p !== '')
  let current = structure
  for (const part of parts) {
    current = current[part]
  }
  return current
}

function getDirectoryContents(structure: any, path: PathLike): string[] {
  const parts = path.split('/').filter(p => p !== '')
  let current = structure
  for (const part of parts) {
    current = current[part]
  }
  return Object.keys(current)
}

function isDirectory(structure: any, path: PathLike): boolean {
  const parts = path.split('/').filter(p => p !== '')
  let current = structure
  for (const part of parts) {
    current = current[part]
  }
  return typeof current === 'object'
}
