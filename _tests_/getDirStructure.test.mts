/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach, Mock} from 'vitest'
import yargs from 'yargs'

import {hideBin} from "yargs/helpers"
import {command, describe as commandDescribe, builder, handler} from '../commands/getDirStructure.mjs'
import * as directoryProcessor from '../directoryProcessor.mjs'

const yargsSetup = yargs(hideBin(process.argv))

describe("Get Directory Structure Command Tests", () => {
    const mockProjectPath = '/mock/project/path'
    const mockFileStructure = {
        name: 'root',
        type: 'directory',
        children: [
            {name: 'file1.txt', type: 'file', content: 'File 1 content'},
            {
                name: 'dir1', type: 'directory', children: [
                    {name: 'file2.txt', type: 'file', content: 'File 2 content'}
                ]
            }
        ]
    }

    beforeEach(() => {
        vi.mock('fs')
        vi.mock('../directoryProcessor.mjs')
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { })

            ; (directoryProcessor.getDirStructure as Mock).mockResolvedValue(mockFileStructure)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns help output", async () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler}).help()

        const output = await new Promise((resolve) => {
            parser.parse("dirStructure --help", (_err: any, _argv: any, output: unknown) => {
                resolve(output)
            })
        })

        expect(output).toContain("Get Directory Structure")
        expect(output).toContain("--verbose")
        expect(output).toContain("--withContent")
        expect(output).toContain("--ignore")
    })

    it("calls getDirStructure with correct parameters", async () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        await new Promise((resolve) => {
            parser.parse(`dirStructure ${mockProjectPath} --verbose --withContent --ignore node_modules dist`, (_err: any, argv: unknown) => {
                resolve(argv)
            })
        })

        expect(directoryProcessor.getDirStructure).toHaveBeenCalledWith(
            mockProjectPath,
            ['node_modules', 'dist'],
            true
        )
    })

    it("logs directory structure with content when withContent is true", async () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        await new Promise((resolve) => {
            parser.parse(`dirStructure ${mockProjectPath} --withContent`, (_err: any, argv: unknown) => {
                resolve(argv)
            })
        })

        expect(console.log).toHaveBeenCalledWith(JSON.stringify(mockFileStructure))
    })

    it("logs directory structure without content when withContent is false", async () => {
        const expectedStructureWithoutContent = JSON.parse(JSON.stringify(mockFileStructure))
        const removeContent = (node: any) => {
            delete node.content
            if (node.children) {
                node.children.forEach(removeContent)
            }
        }
        removeContent(expectedStructureWithoutContent)

        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        await new Promise((resolve) => {
            parser.parse(`dirStructure ${mockProjectPath} --withContent false`, (_err: any, argv: unknown) => {
                resolve(argv)
            })
        })

        expect(console.log).toHaveBeenCalledWith(JSON.stringify(expectedStructureWithoutContent))
    })

    it("uses default values when not provided", async () => {
        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        await new Promise((resolve) => {
            parser.parse(`dirStructure ${mockProjectPath}`, (_err: any, argv: unknown) => {
                resolve(argv)
            })
        })

        expect(directoryProcessor.getDirStructure).toHaveBeenCalledWith(
            mockProjectPath,
            [],
            false
        )
    })

    it("handles errors from getDirStructure", async () => {
        const mockError = new Error("Mock error")
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        (directoryProcessor.getDirStructure as Mock).mockRejectedValue(mockError)

        const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
        await new Promise((resolve) => {
            parser.parse(`dirStructure ${mockProjectPath}`, (_err: any, argv: unknown) => {
                resolve(argv)
            })
        })

        expect(consoleSpy).toHaveBeenCalledWith("Error analyzing directory structure:", mockError)
    })

    // it("handles invalid project path", async () => {
    //     const parser = yargsSetup.command({command, describe: commandDescribe, builder, handler})
    //     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    //     await new Promise((resolve) => {
    //         parser.parse(`dirStructure`, (_err: any, argv: unknown) => {
    //             console.log({argv})
    //             resolve(argv)
    //         })
    //     })

    //     expect(consoleSpy).toHaveBeenCalledWith("Error: Project path is required")
    // })


})
