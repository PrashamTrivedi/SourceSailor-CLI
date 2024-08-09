/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import yargs from 'yargs'
import {hideBin} from "yargs/helpers"
import {command, describe as commandDescribe, builder, handler} from '../commands/listModels.mjs'
import OpenAIInferrence from '../openai.mjs'

const yargsSetup = yargs(hideBin(process.argv))

vi.mock('../openai.mjs')

describe("List Models Command Tests", () => {
  const mockModels = ['gpt-4', 'gpt-3.5-turbo', 'davinci']

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'error').mockImplementation(() => { })
    vi.mocked(OpenAIInferrence.prototype.listModels).mockResolvedValue(mockModels)
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

    expect(output).toContain("List all available OpenAI models")
    expect(output).toContain("--verbose")
  })

  it("lists models without verbose flag", async () => {
    const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
    await new Promise((resolve) => {
      parser.parse("listModels", (_err: any, argv: unknown) => {
        resolve(argv)
      })
    })

    expect(console.log).toHaveBeenCalledWith("List all available OpenAI models")
    expect(console.log).toHaveBeenCalledWith(mockModels)
  })

  it("lists models with verbose flag", async () => {
    const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
    await new Promise((resolve) => {
      parser.parse("listModels --verbose", (_err: any, argv: unknown) => {
        resolve(argv)
      })
    })

    expect(console.log).toHaveBeenCalledWith("List all available OpenAI models")
    expect(OpenAIInferrence.prototype.listModels).toHaveBeenCalledWith(true)
    expect(console.log).toHaveBeenCalledWith(mockModels)
  })

  it("handles errors when listing models", async () => {
    const mockError = new Error("API Error")
    vi.mocked(OpenAIInferrence.prototype.listModels).mockRejectedValue(mockError)

    const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
    await new Promise((resolve) => {
      parser.parse("listModels", (_err: any, argv: unknown) => {
        resolve(argv)
      })
    })

    expect(console.error).toHaveBeenCalledWith('Error listing models:', mockError)
  })
})
