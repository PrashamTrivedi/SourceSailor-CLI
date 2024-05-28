import {exec} from 'child_process'
import {expect} from 'chai'
import nock from 'nock'

describe('CLI Integration with Mock Server', function () {
    this.timeout(20000) // Increase if necessary

    const OPEN_AI_BASE_URL = 'https://api.openai.com'
    const CHAT_COMPLETIONS_ENDPOINT = '/v1/chat/completions'
    const LIST_MODELS_ENDPOINT = '/v1/models'

    before((done) => {
        // Intercepts OpenAI API calls and provides mock responses
        nock(OPEN_AI_BASE_URL)
            .post(CHAT_COMPLETIONS_ENDPOINT)
            .reply(200, {
                id: "cmpl-3evd6IH",
                object: "text_completion",
                created: 1638484860,
                model: "text-davinci-003",
                choices: [
                    {
                        text: "This is a mocked response.",
                        index: 0,
                        logprobs: null,
                        finish_reason: "stop"
                    }
                ]
            })

        nock(OPEN_AI_BASE_URL)
            .get(LIST_MODELS_ENDPOINT)
            .reply(200, {
                data: [
                    {id: "mock-model-1", created: 1638484860},
                    {id: "mock-model-2", created: 1638484860}
                ]
            })

        // nock.enableNetConnect()
        done()
    })

    after(() => {
        // Ensure all nocks are clean after tests
        nock.cleanAll()
    })

    it('should analyze directory structure and generate report', (done) => {
        exec('SourceSailor analyse ./testDirectory --verbose --openai --ignore node_modules', (error, stdout, stderr) => {
            console.log({stderr, stdout})
            expect(stderr).to.be.empty
            expect(stdout).to.include('Inferred workflow: This is a mocked response.')
            done()
        })
    })

    it('should setup OpenAI API key and default model', (done) => {
        exec('SourceSailor setup --apiKey testKey --model gpt-3.5-turbo', (error, stdout, stderr) => {
            console.log({stderr, stdout})
            expect(stderr).to.be.empty
            expect(stdout).to.include('Setting up OpenAI API Key: testKey and default model: gpt-3.5-turbo')
            done()
        })
    })

    it('should list all available OpenAI models', (done) => {
        exec('SourceSailor listModels --verbose', (error, stdout, stderr) => {
            console.log({stderr, stdout})
            expect(stderr).to.be.empty
            expect(stdout).to.include('mock-model-1')
            expect(stdout).to.include('mock-model-2')
            done()
        })
    })
})