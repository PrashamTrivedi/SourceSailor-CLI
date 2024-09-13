/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import OpenAI from 'openai'
import OpenAIInferrence from "../openai.mjs"
import { Stream } from 'openai/streaming'

// Mock OpenAI
vi.mock('openai')

// Mock console.log to prevent output during tests
vi.spyOn(console, 'log').mockImplementation(() => { })

// Mock Stream
class MockStream extends Stream<OpenAI.Chat.Completions.ChatCompletionChunk> {
    private chunks: string[];
    constructor(chunks: string[]) {
        super();
        this.chunks = chunks;
    }
    async *[Symbol.asyncIterator]() {
        for (const chunk of this.chunks) {
            yield { choices: [{ delta: { content: chunk } }] } as OpenAI.Chat.Completions.ChatCompletionChunk;
        }
    }
}

describe('OpenAIInferrence', () => {
    let openAIInferrence: OpenAIInferrence
    let mockOpenAI: any

    beforeEach(() => {
        mockOpenAI = {
            chat: {
                completions: {
                    create: vi.fn(),
                },
            },
            models: {
                list: vi.fn(),
            },
        };
        (OpenAI as any).mockImplementation(() => mockOpenAI)
        openAIInferrence = new OpenAIInferrence()


        // Mock getModel method
        vi.spyOn(openAIInferrence as any, 'getModel').mockResolvedValue('gpt-4')
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('Prompt Generation', () => {
        it('should generate a prompt without user expertise', () => {
            const systemPrompt = 'System prompt'
            const userPrompt = 'User prompt'
            const result = (openAIInferrence as any).createPrompt(systemPrompt, userPrompt, false)
            expect(result).toEqual([
                {role: 'system', content: 'System prompt'},
                {role: 'user', content: 'User prompt'}
            ])
        })

        it('should generate a prompt with user expertise', () => {
            const systemPrompt = 'System prompt'
            const userPrompt = 'User prompt'
            const userExpertise = 'Expert'
            const result = (openAIInferrence as any).createPrompt(systemPrompt, userPrompt, false, userExpertise)
            expect(result).toEqual([
                {role: 'system', content: 'System prompt\n<Expertise>"Expert"</Expertise>'},
                {role: 'user', content: 'User prompt'}
            ])
        })

        it('should log prompts when verbose is true', () => {
            const consoleSpy = vi.spyOn(console, 'log')
            const systemPrompt = 'System prompt'
            const userPrompt = 'User prompt';
            (openAIInferrence as any).createPrompt(systemPrompt, userPrompt, true)
            expect(consoleSpy).toHaveBeenCalledWith('System Prompt: System prompt')
            expect(consoleSpy).toHaveBeenCalledWith('User Prompt: User prompt')
        })
    })

    describe('inferProjectDirectory', () => {
        it('should return a valid inference for a project directory', async () => {
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: 'Project directory inference',
                            tool_calls: [{function: {arguments: '{"projectType":"nodejs","mainLanguage":"typescript"}'}}],
                        },
                    },
                ],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

            const result = await openAIInferrence.inferProjectDirectory('{"src": {}, "package.json": {}}', false, false)
            expect(result).toBe('{"projectType":"nodejs","mainLanguage":"typescript"}')
        })

        it('should handle responses without tool_calls', async () => {
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: '{"projectType":"python","mainLanguage":"python"}',
                        },
                    },
                ],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

            const result = await openAIInferrence.inferProjectDirectory('{"src": {}, "requirements.txt": {}}', false, false)
            expect(result).toBe('{"projectType":"python","mainLanguage":"python"}')
        })

        it('should handle empty responses', async () => {
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: '',
                        },
                    },
                ],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

            const result = await openAIInferrence.inferProjectDirectory('{}', false, false)
            expect(result).toBeUndefined()
        })




        it('should handle invalid JSON input', async () => {
            await expect(openAIInferrence.inferProjectDirectory('invalid json', false, false)).rejects.toThrow()
        })

        it('should use a non-default model when specified', async () => {
            const mockResponse = {
                choices: [{message: {content: 'Project directory inference'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            vi.spyOn(openAIInferrence as any, 'getModel').mockResolvedValue('gpt-3.5-turbo')

            process.env.DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo'
            await openAIInferrence.inferProjectDirectory('{"src": {}}', false, false)
            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({model: 'gpt-3.5-turbo'}))
            delete process.env.DEFAULT_OPENAI_MODEL
        })
    })

    describe('inferDependency', () => {
        it('should return a valid inference for dependencies', async () => {
            const mockResponse = {
                choices: [{message: {content: 'Dependency inference'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferDependency('{"dependencies": {"react": "^17.0.2"}}', 'build',
                false, false)
            expect(result).toBe('Dependency inference')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Dependency', ' inference', ' streaming'])
            mockOpenAI.chat.completions.create.mockResolvedValue(mockStream)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferDependency('{"dependencies": {}}', 'test', true, false)
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in (result as any)).toBe(true)
            
            let streamedContent = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedContent += chunk
            }
            expect(streamedContent).toBe('Dependency inference streaming')
        })

        it('should handle empty dependency file', async () => {
            const mockResponse = {
                choices: [{message: {content: 'No dependencies found'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferDependency('{}', 'build', false, false)
            expect(result).toBe('No dependencies found')
        })

        it('should handle invalid workflow input', async () => {
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})
            await expect(openAIInferrence.inferDependency('{"dependencies": {}}', '', false, false)).rejects.toThrow()
        })
    })

    describe('inferCode', () => {
        it('should return a valid inference for code', async () => {
            const mockResponse = {
                choices: [{message: {content: 'Code inference'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferCode('function hello() { console.log("Hello"); }', false, false)
            expect(result).toBe('Code inference')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Code', ' inference', ' streaming'])
            mockOpenAI.chat.completions.create.mockResolvedValue(mockStream)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferCode('const x = 5;', true, false)
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in (result as any)).toBe(true)
            
            let streamedContent = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedContent += chunk
            }
            expect(streamedContent).toBe('Code inference streaming')
        })


        it('should handle empty code input', async () => {
            const mockResponse = {
                choices: [{message: {content: 'No code provided'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferCode('', false, false)
            expect(result).toBe('No code provided')
        })

    })

    describe('inferInterestingCode', () => {
        it('should return interesting parts of the code', async () => {
            const mockResponse = {
                choices: [{message: {content: 'Interesting code parts'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferInterestingCode('function complexAlgorithm() { /* ... */ }', false, false)
            expect(result).toBe('Interesting code parts')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Interesting', ' code', ' parts', ' streaming'])
            mockOpenAI.chat.completions.create.mockResolvedValue(mockStream)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferInterestingCode('class AdvancedComponent { /* ... */ }', true, false)
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in (result as any)).toBe(true)
            
            let streamedContent = ''
            if (result) {
                for await (const chunk of result as AsyncIterable<string>) {
                    streamedContent += chunk
                }
            }
            expect(streamedContent).toBe('Interesting code parts streaming')
        })

        it('should handle code with no particularly interesting parts', async () => {
            const mockResponse = {
                choices: [{message: {content: 'No particularly interesting code parts found'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.inferInterestingCode('console.log("Hello, World!");', false, false)
            expect(result).toBe('No particularly interesting code parts found')
        })

        it('should handle code in different languages', async () => {
            const mockResponse = {
                choices: [{message: {content: 'Interesting Java code parts'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const javaCode = `
                public class HelloWorld {
                    public static void main(String[] args) {
                        System.out.println("Hello, World!");
                    }
                }
            `
            const result = await openAIInferrence.inferInterestingCode(javaCode, false, false)
            expect(result).toBe('Interesting Java code parts')
        })
    })

    describe('generateReadme', () => {
        it('should generate a README based on provided information', async () => {
            const mockResponse = {
                choices: [{message: {content: 'Generated README content'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.generateReadme(
                '{"src": {}, "package.json": {}}',
                '{"dependencies": {"react": "^17.0.2"}}',
                'function App() { return <div>Hello</div>; }',
                false,
                false
            )
            expect(result).toBe('Generated README content')
        })

        it('should handle empty inputs', async () => {
            const mockResponse = {
                choices: [{message: {content: 'README for empty project'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.generateReadme('{}', '{}', '{}', false, false)
            expect(result).toBe('README for empty project')
        })


        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Generated', ' README', ' content', ' streaming'])
            mockOpenAI.chat.completions.create.mockResolvedValue(mockStream)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.generateReadme('{}', '{}', '{}', true, false)
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in result).toBe(true)
            
            let streamedContent = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedContent += chunk
            }
            expect(streamedContent).toBe('Generated README content streaming')
        })
    })

    describe('generateMonorepoReadme', () => {
        it('should generate a README for a monorepo', async () => {
            const mockResponse = {
                choices: [{message: {content: 'Generated Monorepo README content'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.generateMonorepoReadme(
                '{"packages": {"app1": {}, "app2": {}}}',
                false,
                false
            )
            expect(result).toBe('Generated Monorepo README content')
        })

        it('should handle empty monorepo structure', async () => {
            const mockResponse = {
                choices: [{message: {content: 'README for empty monorepo'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.generateMonorepoReadme('{}', false, false)
            expect(result).toBe('README for empty monorepo')
        })

        it('should handle complex monorepo structure', async () => {
            const complexMonorepo = JSON.stringify({
                packages: {
                    app1: {dependencies: {}, src: {}},
                    app2: {dependencies: {}, src: {}},
                    shared: {dependencies: {}, src: {}}
                },
                root: {package: {}, tsconfig: {}}
            })
            const mockResponse = {
                choices: [{message: {content: 'README for complex monorepo'}}],
            }
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.generateMonorepoReadme(complexMonorepo, false, false)
            expect(result).toBe('README for complex monorepo')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Generated', ' Monorepo', ' README', ' content', ' streaming'])
            mockOpenAI.chat.completions.create.mockResolvedValue(mockStream)
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            const result = await openAIInferrence.generateMonorepoReadme('{}', true, false)
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in result).toBe(true)
            
            let streamedContent = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedContent += chunk
            }
            expect(streamedContent).toBe('Generated Monorepo README content streaming')
        })
    })

    describe('listModels', () => {
        it('should return a list of available models', async () => {
            const mockModels = {
                data: [
                    {id: 'gpt-4', created: 1000},
                    {id: 'gpt-3.5-turbo', created: 900},
                ],
            }
            mockOpenAI.models.list.mockResolvedValue(mockModels)

            const result = await openAIInferrence.listModels(false)
            expect(result).toEqual(['gpt-4', 'gpt-3.5-turbo'])
        })

        it('should sort models by creation date in descending order', async () => {
            const mockModels = {
                data: [
                    {id: 'gpt-3.5-turbo', created: 900},
                    {id: 'gpt-4', created: 1000},
                    {id: 'gpt-4-32k', created: 1100},
                ],
            }
            mockOpenAI.models.list.mockResolvedValue(mockModels)

            const result = await openAIInferrence.listModels(false)
            expect(result).toEqual(['gpt-4-32k', 'gpt-4', 'gpt-3.5-turbo'])
        })

        it('should handle empty model list', async () => {
            mockOpenAI.models.list.mockResolvedValue({data: []})

            const result = await openAIInferrence.listModels(false)
            expect(result).toEqual([])
        })

        it('should handle API call failure', async () => {
            mockOpenAI.models.list.mockRejectedValue(new Error('API Error'))

            await expect(openAIInferrence.listModels(false)).rejects.toThrow('API Error')
        })
    })
    describe('General error handling', () => {
        it('should handle OpenAI API being down', async () => {
            mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API is down'))
            mockOpenAI.models.list.mockResolvedValue({data: [{id: 'gpt-4'}]})

            await expect(openAIInferrence.inferProjectDirectory('{"src": {}}', false, false)).rejects.toThrow('OpenAI API is down')
        })


    })

})
