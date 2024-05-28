import {exec} from 'child_process'
import {expect} from 'chai'
import sinon from "sinon"
import OpenAI from "openai"

describe('CLI Integration with Mock Server', function () {
    // this.timeout(50000) // Increase if necessary
    let chatCompletionStub
    let modelsStub
    this.beforeEach(() => {
        // NEED TO MAKE THIS WORK
        const openai = new OpenAI({
            apiKey: 'testKey'
        })
        chatCompletionStub = sinon.stub(openai.chat.completions, 'create')
        modelsStub = sinon.stub(openai.models, 'list')
    })

    this.afterEach(() => {
        sinon.reset()
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
        modelsStub.resolves({data: {data: [{id: 'mock-model-1'}, {id: 'mock-model-2'}]}})
        exec('SourceSailor listModels --verbose', (error, stdout, stderr) => {
            console.log({stderr, stdout})
            expect(stderr).to.be.empty
            expect(stdout).to.include('mock-model-1')
            expect(stdout).to.include('mock-model-2')
            done()
        })
    })
})