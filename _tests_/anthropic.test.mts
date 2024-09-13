/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import Anthropic from '@anthropic-ai/sdk'
import AnthropicInterface from '../anthropic.mjs'
import {Stream} from '@anthropic-ai/sdk/streaming.mjs'

// Mock Anthropic
vi.mock('@anthropic-ai/sdk')

// Mock console.log to prevent output during tests
vi.spyOn(console, 'log').mockImplementation(() => { })

// Mock Stream
class MockStream {
    private chunks: string[]
    constructor(chunks: string[]) {
        this.chunks = chunks
    }
    async *[Symbol.asyncIterator]() {
        for (const chunk of this.chunks) {
            yield {type: 'content_block_delta', delta: {type: 'text_delta', text: chunk}}
        }
    }
}

describe('AnthropicInterface', () => {
    let anthropicInterface: AnthropicInterface
    let mockAnthropic: any

    beforeEach(() => {
        mockAnthropic = {
            messages: {
                create: vi.fn(),
            },
        };
        (Anthropic as any).mockImplementation(() => mockAnthropic)
        anthropicInterface = new AnthropicInterface()

        // Mock getModel method
        vi.spyOn(anthropicInterface as any, 'getModel').mockResolvedValue('claude-3-opus-20240229')
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('getName', () => {
        it('should return "Anthropic"', () => {
            expect(anthropicInterface.getName()).toBe('Anthropic')
        })
    })

    describe('listModels', () => {
        it('should return a list of available models', async () => {
            const expectedModels = ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus', 'claude-3.5-sonnet', 'haiku-3', 'sonnet-3', 'opus-3', 'sonnet-3.5']
            const result = await anthropicInterface.listModels(false)
            expect(result).toEqual(expectedModels)
        })

        it('should log models when verbose is true', async () => {
            const consoleSpy = vi.spyOn(console, 'log')
            await anthropicInterface.listModels(true)
            expect(consoleSpy).toHaveBeenCalledWith('Available Anthropic models:', expect.any(String))
        })
    })

    describe('inferProjectDirectory', () => {
        it('should return a valid inference for a project directory', async () => {
            const mockResponse = {
                content: [{
                    type: 'text',
                    text: '{"projectType":"nodejs","mainLanguage":"typescript"}'
                }],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferProjectDirectory('{"src": {}, "package.json": {}}', false, false)
            expect(result).toBe('{"projectType":"nodejs","mainLanguage":"typescript"}')
        })




        it('should handle responses without tool use', async () => {
            const mockResponse = {
                content: [{type: 'text', text: '{"projectType":"python","mainLanguage":"python"}'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferProjectDirectory('{"src": {}, "requirements.txt": {}}', false, false)
            expect(result).toBe('{"projectType":"python","mainLanguage":"python"}')
        })

        it('should handle empty responses', async () => {
            const mockResponse = {
                content: [],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferProjectDirectory('{}', false, false)
            expect(result).toBe('')
        })

        it('should handle invalid JSON input', async () => {
            await expect(anthropicInterface.inferProjectDirectory('invalid json', false, false)).rejects.toThrow()
        })

        it('should use a non-default model when specified', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'Project directory inference'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)
            vi.spyOn(anthropicInterface as any, 'getModel').mockReturnValue('claude-3-sonnet-20240229')

            await anthropicInterface.inferProjectDirectory('{"src": {}}', false, false, undefined, 'claude-3-sonnet-20240229')
            expect(mockAnthropic.messages.create).toHaveBeenCalledWith(expect.objectContaining({model: 'claude-3-sonnet-20240229'}))
        })
    })

    describe('inferDependency', () => {
        it('should return a valid inference for dependencies', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'Dependency inference'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferDependency('{"dependencies": {"react": "^17.0.2"}}', 'build', false, false)
            expect(result).toBe('Dependency inference')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Dependency', ' inference', ' streaming'])
            mockAnthropic.messages.create.mockResolvedValue(mockStream)

            const result = await anthropicInterface.inferDependency('{"dependencies": {}}', 'test', true, true)
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
                content: [{type: 'text', text: 'No dependencies found'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferDependency('{}', 'build', false, false)
            expect(result).toBe('No dependencies found')
        })

        it('should handle invalid workflow input', async () => {
            await expect(anthropicInterface.inferDependency('{"dependencies": {}}', '', false, false)).rejects.toThrow()
        })
    })

    describe('inferCode', () => {
        it('should return a valid inference for code', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'Code inference: This is a React component'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferCode('function App() { return <div>Hello</div>; }', false, false)
            expect(result).toBe('Code inference: This is a React component')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Code', ' inference:', ' This', ' is', ' a', ' React', ' component'])
            mockAnthropic.messages.create.mockResolvedValue(mockStream)

            const result = await anthropicInterface.inferCode('function App() { return <div>Hello</div>; }', true, true)
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in (result as any)).toBe(true)

            let streamedContent = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedContent += chunk
            }
            expect(streamedContent).toBe('Code inference: This is a React component')
        })

        it('should handle empty code input', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'No code provided'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferCode('', false, false)
            expect(result).toBe('No code provided')
        })

        it('should use a non-default model when specified', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'Code inference'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)
            vi.spyOn(anthropicInterface as any, 'getModel').mockReturnValue('claude-3-sonnet-20240229')

            await anthropicInterface.inferCode('const x = 5;', false, true, undefined, 'claude-3-sonnet-20240229')
            expect(mockAnthropic.messages.create).toHaveBeenCalledWith(expect.objectContaining({model: 'claude-3-sonnet-20240229'}))
        })
    })

    describe('inferInterestingCode', () => {
        it('should return interesting parts of the code', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'Interesting code: Complex algorithm found'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferInterestingCode('function complexAlgorithm() { /* ... */ }', false, false)
            expect(result).toBe('Interesting code: Complex algorithm found')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['Interesting', ' code:', ' Complex', ' algorithm', ' found'])
            mockAnthropic.messages.create.mockResolvedValue(mockStream)

            const result = await anthropicInterface.inferInterestingCode('class AdvancedComponent { /* ... */ }', true, true)
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in (result as any)).toBe(true)

            let streamedContent = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedContent += chunk
            }
            expect(streamedContent).toBe('Interesting code: Complex algorithm found')
        })

        it('should handle code with no particularly interesting parts', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'No particularly interesting code parts found'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.inferInterestingCode('console.log("Hello, World!");', false, false)
            expect(result).toBe('No particularly interesting code parts found')
        })

        it('should handle code in different languages', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'Interesting Java code: Main method implementation'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const javaCode = `
                public class HelloWorld {
                    public static void main(String[] args) {
                        System.out.println("Hello, World!");
                    }
                }
            `
            const result = await anthropicInterface.inferInterestingCode(javaCode, false, false)
            expect(result).toBe('Interesting Java code: Main method implementation')
        })

        it('should use a non-default model when specified', async () => {
            const mockResponse = {
                content: [{type: 'text', text: 'Interesting code found'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)
            vi.spyOn(anthropicInterface as any, 'getModel').mockReturnValue('claude-3-sonnet-20240229')

            await anthropicInterface.inferInterestingCode('function complexAlgorithm() {}', false, true, undefined, 'claude-3-sonnet-20240229')
            expect(mockAnthropic.messages.create).toHaveBeenCalledWith(expect.objectContaining({model: 'claude-3-sonnet-20240229'}))
        })
    })

    describe('generateReadme', () => {
        it('should generate a README based on provided information', async () => {
            const mockResponse = {
                content: [{type: 'text', text: '# Project Name\n\nThis is a generated README.'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.generateReadme(
                '{"src": {}, "package.json": {}}',
                '{"dependencies": {"react": "^17.0.2"}}',
                'function App() { return <div>Hello</div>; }',
                false,
                false
            )
            expect(result).toBe('# Project Name\n\nThis is a generated README.')
        })

        it('should handle empty inputs', async () => {
            const mockResponse = {
                content: [{type: 'text', text: '# Empty Project\n\nNo project structure or code provided.'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)

            const result = await anthropicInterface.generateReadme('{}', '{}', '{}', false, false)
            expect(result).toBe('# Empty Project\n\nNo project structure or code provided.')
        })

        it('should handle streaming responses', async () => {
            const mockStream = new MockStream(['# Project', ' Name\n\n', 'This is a ', 'generated README.'])
            mockAnthropic.messages.create.mockResolvedValue(mockStream)

            const result = await anthropicInterface.generateReadme(
                '{"src": {}}',
                '{"dependencies": {}}',
                'const x = 5;',
                true,
                true
            )
            expect(result).toBeInstanceOf(Object)
            expect(Symbol.asyncIterator in (result as any)).toBe(true)

            let streamedContent = ''
            for await (const chunk of result as AsyncIterable<string>) {
                streamedContent += chunk
            }
            expect(streamedContent).toBe('# Project Name\n\nThis is a generated README.')
        })

        it('should use a non-default model when specified', async () => {
            const mockResponse = {
                content: [{type: 'text', text: '# Generated README'}],
                stop_reason: 'end_turn'
            }
            mockAnthropic.messages.create.mockResolvedValue(mockResponse)
            vi.spyOn(anthropicInterface as any, 'getModel').mockReturnValue('claude-3-sonnet-20240229')

            await anthropicInterface.generateReadme('{}', '{}', '{}', false, true, undefined, 'claude-3-sonnet-20240229')
            expect(mockAnthropic.messages.create).toHaveBeenCalledWith(expect.objectContaining({model: 'claude-3-sonnet-20240229'}))
        })
    })

   
})
