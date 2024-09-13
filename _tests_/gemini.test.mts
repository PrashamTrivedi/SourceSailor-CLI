/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {GoogleGenerativeAI} from "@google/generative-ai"
import GeminiInference from "../gemini.mjs"

// Mock GoogleGenerativeAI
vi.mock('@google/generative-ai')

// Mock console.log to prevent output during tests
vi.spyOn(console, 'log').mockImplementation(() => { })

describe('GeminiInference', () => {
    let geminiInference: GeminiInference
    let mockGoogleGenerativeAI: any

    beforeEach(() => {
        mockGoogleGenerativeAI = {
            getGenerativeModel: vi.fn().mockReturnValue({
                generateContent: vi.fn(),
                generateContentStream: vi.fn(),
            }),
        };
        (GoogleGenerativeAI as any).mockImplementation(() => mockGoogleGenerativeAI)
        geminiInference = new GeminiInference()

        // Mock getModel method
        vi.spyOn(geminiInference as any, 'getModel').mockResolvedValue('gemini-pro')
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('Prompt Generation', () => {
        it('should generate a prompt without user expertise', () => {
            const userPrompt = 'Test prompt'
            const result = (geminiInference as any).createPrompt(userPrompt, false)
            expect(result).toBe(userPrompt)
        })

        it('should generate a prompt with user expertise', () => {
            const userPrompt = 'Test prompt'
            const userExpertise = 'Expert'
            const result = (geminiInference as any).createPrompt(userPrompt, false, userExpertise)
            expect(result).toBe(`<Expertise>${JSON.stringify(userExpertise)}</Expertise>\n\n${userPrompt}`)
        })

        it('should log prompts when verbose is true', () => {
            const consoleSpy = vi.spyOn(console, 'log')
            const userPrompt = 'Test prompt';
            (geminiInference as any).createPrompt(userPrompt, true)
            expect(consoleSpy).toHaveBeenCalledWith(`Full Prompt: ${userPrompt}`)
        })
    })

    describe('inferProjectDirectory', () => {
        it('should return a valid inference for a project directory', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('{"isMonorepo":false,"directories":["src"],"programmingLanguage":"typescript","framework":"react","dependenciesFile":"package.json","lockFile":"package-lock.json","entryPointFile":"src/index.ts","workflow":"npm"}')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferProjectDirectory('{"src": {}, "package.json": {}}', false, false)
            expect(JSON.parse(result as string)).toEqual({
                isMonorepo: false,
                directories: ['src'],
                programmingLanguage: 'typescript',
                framework: 'react',
                dependenciesFile: 'package.json',
                lockFile: 'package-lock.json',
                entryPointFile: 'src/index.ts',
                workflow: 'npm'
            })
        })

        it('should handle empty responses', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferProjectDirectory('{}', false, false)
            expect(result).toEqual('')
        })

        it('should handle invalid JSON input', async () => {
            await expect(geminiInference.inferProjectDirectory('invalid json', false, false)).rejects.toThrow()
        })

        it('should use a non-default model when specified', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('{}')
                }
            }
            const getModelSpy = vi.spyOn(geminiInference as any, 'getModel').mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            await geminiInference.inferProjectDirectory('{"src": {}}', false, false, undefined, 'gemini-pro-1')
            expect(getModelSpy).toHaveBeenCalledWith('gemini-pro-1', expect.any(String))
        })
    })

    describe('inferDependency', () => {
        it('should return a valid inference for dependencies', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('Dependency inference result')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferDependency('{"dependencies": {"react": "^17.0.2"}}', 'build', false, false)
            expect(result).toBe('Dependency inference result')
        })

        it('should handle empty dependency file', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('No dependencies found')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferDependency('{}', 'build', false, false)
            expect(result).toBe('No dependencies found')
        })

        it('should handle invalid workflow input', async () => {
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockRejectedValue(new Error('Workflow cannot be empty'))
            })

            await expect(geminiInference.inferDependency('{"dependencies": {}}', '', false, false))
                .rejects.toThrow('Workflow cannot be empty')
        })

        it('should handle streaming mode', async () => {
            const mockStreamResponse = {
                stream: [{ text: vi.fn().mockReturnValue('Streamed ') }, { text: vi.fn().mockReturnValue('response') }]
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContentStream: vi.fn().mockResolvedValue(mockStreamResponse)
            })

            const result = await geminiInference.inferDependency('{"dependencies": {}}', 'test', true, false)
            expect(typeof result[Symbol.asyncIterator]).toBe('function')
            
            let streamedResult = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedResult += chunk
            }
            expect(streamedResult).toBe('Streamed response')
        })
    })

    describe('inferCode', () => {
        it('should return a valid inference for code', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('Code inference result')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferCode('function hello() { console.log("Hello"); }', false, false)
            expect(result).toBe('Code inference result')
        })

        it('should handle empty code input', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('No code provided')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferCode('', false, false)
            expect(result).toBe('No code provided')
        })
    })

    describe('inferInterestingCode', () => {
        it('should return interesting parts of the code', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('Interesting code parts: complex algorithm')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferInterestingCode('function complexAlgorithm() { /* ... */ }', false, false)
            expect(result).toBe('Interesting code parts: complex algorithm')
        })

        it('should handle code with no particularly interesting parts', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('No particularly interesting code parts found')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.inferInterestingCode('console.log("Hello, World!");', false, false)
            expect(result).toBe('No particularly interesting code parts found')
        })

        it('should handle code in different languages', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('Interesting Java code parts: main method')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const javaCode = `
                public class HelloWorld {
                    public static void main(String[] args) {
                        System.out.println("Hello, World!");
                    }
                }
            `
            const result = await geminiInference.inferInterestingCode(javaCode, false, false)
            expect(result).toBe('Interesting Java code parts: main method')
        })
    })

    describe('generateReadme', () => {
        it('should generate a README based on provided information', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('# Project README\n\nThis is a sample README.')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.generateReadme(
                '{"src": {}, "package.json": {}}',
                '{"dependencies": {"react": "^17.0.2"}}',
                'function App() { return <div>Hello</div>; }',
                false,
                false
            )
            expect(result).toBe('# Project README\n\nThis is a sample README.')
        })

        it('should handle empty inputs', async () => {
            const mockResponse = {
                response: {
                    text: vi.fn().mockReturnValue('# Empty Project\n\nNo project information available.')
                }
            };
            (geminiInference as any).getModel = vi.fn().mockResolvedValue({
                generateContent: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await geminiInference.generateReadme('{}', '{}', '', false, false)
            expect(result).toBe('# Empty Project\n\nNo project information available.')
        })
    })

    describe('listModels', () => {
        it('should return a list of available models', async () => {
            const mockModels = [
                { name: 'models/gemini-pro', limit: 8192 },
                { name: 'models/gemini-vision-pro', limit: 4096 }
            ];
            (geminiInference as any).listModels = vi.fn().mockResolvedValue(mockModels)

            const result = await geminiInference.listModels(false)
            expect(result).toEqual(mockModels)
        })

        it('should handle empty model list', async () => {
            (geminiInference as any).listModels = vi.fn().mockResolvedValue([])

            const result = await geminiInference.listModels(false)
            expect(result).toEqual([])
        })

        it('should handle API call failure', async () => {
            (geminiInference as any).listModels = vi.fn().mockRejectedValue(new Error('API Error'))

            await expect(geminiInference.listModels(false)).rejects.toThrow('API Error')
        })
    })

    describe('General error handling', () => {
        it('should handle Gemini API being down', async () => {
            (geminiInference as any).getModel = vi.fn().mockRejectedValue(new Error('Gemini API is down'))

            await expect(geminiInference.inferProjectDirectory('{"src": {}}', false, false)).rejects.toThrow('Gemini API is down')
        })
    })
})
