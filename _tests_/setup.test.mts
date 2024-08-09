/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach, Mock} from 'vitest'
import yargs from 'yargs'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {hideBin} from "yargs/helpers"
import {command, describe as commandDescribe, builder, handler} from '../commands/setup.mjs'

const yargsSetup = yargs(hideBin(process.argv))
describe("Setup Command Tests", () => {
    const mockHomeDir = '/mock/home/dir'
    const mockConfigDir = path.join(mockHomeDir, '.SourceSailor')
    const mockConfigFile = path.join(mockConfigDir, 'config.json')

    beforeEach(() => {
        vi.mock('fs')
        vi.mock('os')
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { });

        (os.homedir as Mock).mockReturnValue(mockHomeDir);
        (fs.existsSync as Mock).mockReturnValue(false);
        (fs.mkdirSync as Mock).mockImplementation(() => { });
        (fs.writeFileSync as Mock).mockImplementation(() => { });
        (fs.readFileSync as Mock).mockReturnValue('{}')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns help output", async () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler}).help()

        const output = await new Promise((resolve) => {
            parser.parse("setup --help", (_err: any, _argv: any, output: unknown) => {
                resolve(output)
            })
        })

        expect(output).toContain("Setup OpenAI API Key and default model")
        expect(output).toContain("--apiKey")
        expect(output).toContain("--model")
        expect(output).toContain("--analysisDir")
    })

    it("creates config directory if it doesn't exist", () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        parser.parse("setup --apiKey test-key")

        expect(fs.existsSync).toHaveBeenCalledWith(mockConfigDir)
        expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir)
    })

    it("writes config file with provided values", () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        parser.parse("setup --apiKey test-key --model gpt-4 --analysisDir /custom/dir")

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockConfigFile,
            JSON.stringify({
                OPENAI_API_KEY: 'test-key',
                DEFAULT_OPENAI_MODEL: 'gpt-4',
                ANALYSIS_DIR: '/custom/dir'
            })
        )
    })

    it("uses default values when not provided", () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        parser.parse("setup --apiKey test-key")

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockConfigFile,
            JSON.stringify({
                OPENAI_API_KEY: 'test-key',
                DEFAULT_OPENAI_MODEL: 'gpt-3.5-turbo',
                ANALYSIS_DIR: mockHomeDir
            })
        )
    })

    it("logs setup information", () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        parser.parse("setup --apiKey test-key --model gpt-4")

        expect(console.log).toHaveBeenCalledWith("Setting up OpenAI API Key: test-key and default model: gpt-4")
    })
})
