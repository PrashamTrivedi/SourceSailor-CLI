/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import yargs from 'yargs'
import { hideBin } from "yargs/helpers"
import { command, describe as commandDescribe, builder, handler } from '../commands/listModels.mjs'
import ModelUtils from '../modelUtils.mjs'

const yargsSetup = yargs(hideBin(process.argv))

vi.mock('../modelUtils.mjs')

describe("List Models Command Tests", () => {
  const mockModelsByProvider = {
    'OpenAI': ['gpt-4', 'gpt-3.5-turbo'],
    'Gemini': ['gemini-pro', 'gemini-1.5-pro'],
    'Anthropic': ['claude-2', 'claude-instant-1']
  }

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'error').mockImplementation(() => { })
    vi.mocked(ModelUtils.getInstance).mockReturnValue({
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getModelsByProvider: vi.fn().mockReturnValue(mockModelsByProvider)
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns help output", async () => {
    const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler}).help()

    const output = await new Promise((resolve) => {
      parser.parse("listModels --help", (_err: any, _argv: any, output: unknown) => {
        resolve(output)
      })
    })

    expect(output).toContain("List all available models grouped by provider")
    expect(output).toContain("--verbose")
  })

  it("lists models grouped by provider", async () => {
    const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
    await new Promise((resolve) => {
      parser.parse("listModels", (_err: any, argv: unknown) => {
        resolve(argv)
      })
    })

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Listing all available models grouped by provider:'))
    Object.entries(mockModelsByProvider).forEach(([provider, models]) => {
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`${provider}:`))
      models.forEach(model => {
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`  - ${model}`))
      })
    })
  })

  it("handles errors when listing models", async () => {
    const mockError = new Error("API Error")
    vi.mocked(ModelUtils.getInstance).mockReturnValue({
      initializeModels: vi.fn().mockRejectedValue(mockError),
      getModelsByProvider: vi.fn()
    } as any)

    await handler({} as any)

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error listing models:'), mockError)
  })

  it("handles empty model list for a provider", async () => {
    const emptyModelsByProvider = {
      'OpenAI': ['gpt-4'],
      'Gemini': [],
      'Anthropic': ['claude-2']
    }
    vi.mocked(ModelUtils.getInstance).mockReturnValue({
      initializeModels: vi.fn().mockResolvedValue(undefined),
      getModelsByProvider: vi.fn().mockReturnValue(emptyModelsByProvider)
    } as any)

    const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
    await new Promise((resolve) => {
      parser.parse("listModels", (_err: any, argv: unknown) => {
        resolve(argv)
      })
    })

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('OpenAI:'))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('  - gpt-4'))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Gemini:'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('  - gemini-pro'))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Anthropic:'))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('  - claude-2'))
  })
})
