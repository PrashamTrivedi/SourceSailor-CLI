
import OpenAI from 'openai'

import {get_encoding} from "tiktoken"

import {Stream} from "openai/streaming"
import {prompts} from "./prompts.mjs"
import {readConfig} from "./utils.mjs"


export const calculateTokens = async (messages) => {
    const chatMessages = messages.filter(message => message.content?.length ?? 0 > 0).map(message => message.content)
    const enc = await get_encoding("cl100k_base")
    const tokens = enc.encode(chatMessages.join('\n'))
    return tokens.length

}
function createPrompt(systemPrompt, userPrompt, isVerbose) {
    const compatibilityMessage = [{
        role: "system",
        content: systemPrompt
    }, {
        role: "user",
        content: userPrompt
    }]
    if (isVerbose) {
        console.log(`System Prompt: ${systemPrompt}`)
        console.log(`User Prompt: ${userPrompt}`)
    }
    return compatibilityMessage
}

async function calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits) {
    const tokens = await calculateTokens(compatibilityMessage)
    const modelLimit = modelLimits.find(modelLimit => modelLimit.name === model)
    const modelLimitTokens = modelLimit?.limit ?? 0
    if (isVerbose) {
        console.log(`Model limit: ${modelLimitTokens}, Tokens: ${tokens}`)
    }
    if (modelLimitTokens < tokens) {
        throw new Error(`Prompt is Too Long. It has ${tokens} tokens, but the limit is ${modelLimit?.limit}`)
    }
}

async function callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose, tools) {
    const apiParams = {
        model,
        messages: compatibilityMessage,
        temperature: 0,
        stream: isStreaming
    }
    if (tools) {
        apiParams.tools = tools
        apiParams.tool_choice = {type: "function", function: {name: tools[0].function.name}}
        delete apiParams.stream
        isStreaming = false
    }
    if (isVerbose) {
        console.log(JSON.stringify(apiParams, null, 2))
    }
    const matchJson = await openai.chat.completions.create(apiParams)
    if (isVerbose && !isStreaming) {
        console.log(JSON.stringify(matchJson.choices[0], null, 2))
    }
    if (isStreaming) {
        return matchJson
    } else if (matchJson.choices[0].finish_reason === 'tool_calls' || (matchJson.choices[0].message?.tool_calls?.length ?? 0 > 0)) {
        const response = matchJson.choices[0].message?.tool_calls?.flatMap(toolCall => toolCall?.function?.arguments)
        return response?.join('')
    } else {
        return matchJson.choices[0].message.content || undefined
    }
}

async function getModel(useOpenAi, isVerbose = false) {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const config = readConfig()

    if (useOpenAi) {
        const models = await openai.models.list()
        const gpt4 = models.data.find(model => model.id === config.DEFAULT_OPENAI_MODEL ?? process.env.DEFAULT_OPENAI_MODEL ?? 'gpt-4-0125-preview')
        if (gpt4) {
            return gpt4.id
        } else {
            return models.data.find(model => model.id === 'gpt-3.5-turbo')?.id ?? 'gpt-3.5-turbo'
        }
    } else {
        return Promise.resolve(process.env.OPTIONAL_MODEL ?? "meta-llama/llama-2-13b-chat")
    }
}


function getOpenAiClient(useOpenAi, isVerbose = false) {
    const config = readConfig()


    if (!useOpenAi) {

        return new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: process.env.OPENROUTER_API_URL,
            timeout: 60000,
        })
    }
    return new OpenAI({apiKey: config.OPENAI_API_KEY || process.env.OPENAI_API_KEY, timeout: 60000})
}
const modelLimits = [
    {name: 'gpt-4', limit: 8000},
    {name: 'gpt-4-32k', limit: 32000},
    {name: 'gpt-4-0125-preview', limit: 128000},
    {name: 'gpt-4-turbo', limit: 128000},
    {name: 'gpt-4-1106-preview	', limit: 128000},
    {name: 'gpt-4-turbo-preview	', limit: 128000},
    {name: 'gpt-3.5-turbo', limit: 4000},
    {name: 'gpt-3.5-turbo-16k', limit: 16000}
]

export const inferProjectDirectory = async (projectDirectory, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)

    const compatibilityMessage = createPrompt(
        `${prompts.commonSystemPrompt.prompt}\n${prompts.rootUnderstanding.prompt}`,
        `<FileStructure>${JSON.stringify(projectDirectory)}</FileStructure>`,
        isVerbose
    )

    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)
    const tools = [
        {
            type: "function",
            function: {
                name: prompts.rootUnderstanding.params.name,
                parameters: prompts.rootUnderstanding.params.parameters,
                description: prompts.rootUnderstanding.params.description
            }
        }
    ]
    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose, tools)


}

export const inferDependency = async (dependencyFile, workflow, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const compatibilityMessage = createPrompt(
        `${prompts.commonSystemPrompt.prompt}\n${prompts.dependencyUnderstanding.prompt}`,
        `<DependencyFile>${JSON.stringify(dependencyFile)}</DependencyFile>\n<Workflow>${workflow}</Workflow>`,
        isVerbose
    )

    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)

    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)


}

export const inferFileImports = async (fileContents, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const filePrompt = fileContents.isAst ? prompts.fileImportsAST : prompts.fileImports
    const codeFile = fileContents.contents
    const userMessage = fileContents.isAst ? `<FileAST>${JSON.stringify(codeFile)}</FileAST>` : `<FileStructure>${JSON.stringify(codeFile)}</FileStructure>`

    const compatibilityMessage = createPrompt(
        `${prompts.commonSystemPrompt.prompt}\n${filePrompt.prompt}`,
        userMessage,
        isVerbose
    )
    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)
    const tools = [
        {
            type: "function",
            function: {
                name: filePrompt.params.name,
                parameters: filePrompt.params.parameters,
                description: filePrompt.params.description
            }
        }
    ]

    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose, tools)


}

export const inferCode = async (code, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const compatibilityMessage = createPrompt(
        `${prompts.commonSystemPrompt.prompt}\n${prompts.codeUnderstanding.prompt}`,
        `<Code>${JSON.stringify(code)}</Code>`,
        isVerbose
    )
    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)


    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)

}
export const inferInterestingCode = async (code, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const compatibilityMessage = createPrompt(
        prompts.interestingCodeParts.prompt,
        `<Code>${JSON.stringify(code)}</Code>`,
        isVerbose
    )
    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)
    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)

}

export const inferCodeAST = async (codeAST, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const compatibilityMessage = createPrompt(
        `${prompts.commonSystemPrompt.prompt}\n${prompts.codeUnderstandingAST.prompt}`,
        `<CodeAST>${JSON.stringify(codeAST)}</CodeAST>`,
        isVerbose
    )
    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)


    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)

}
export const inferInterestingCodeAST = async (codeAST, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const compatibilityMessage = createPrompt(
        prompts.interestingCodePartsAST.prompt,
        `<CodeAST>${JSON.stringify(codeAST)}</CodeAST>`,
        isVerbose
    )
    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)
    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)

}

export const generateReadme = async (directoryStructure, dependencyInference, codeInference, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const compatibilityMessage = createPrompt(
        prompts.readmePrompt.prompt,
        `<DirectoryStructure>${JSON.stringify(directoryStructure)}</DirectoryStructure>\n<DependencyInferrence>${JSON.stringify(dependencyInference)}</DependencyInferrence>\n<CodeInferrence>${JSON.stringify(codeInference)}</CodeInferrence>`,
        isVerbose
    )
    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)

    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
}

export const generateMonorepoReadme = async (monorepoInferrenceInfo, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const model = await getModel(useOpenAi)
    const compatibilityMessage = createPrompt(
        prompts.consolidatedInferrenceForMonoRepo.prompt,
        `<MonoRepoInferrence>${JSON.stringify(monorepoInferrenceInfo)}</MonoRepoInferrence>`,
        isVerbose
    )
    await calculateTokensAndCheckLimit(compatibilityMessage, model, isVerbose, modelLimits)

    return callApiAndReturnResult(openai, model, compatibilityMessage, isStreaming, isVerbose)
}

export const listModels = async (isVerbose = false) => {

    const openai = getOpenAiClient(true, isVerbose)
    const models = await openai.models.list()

    if (isVerbose) {
        console.log(models.data)
    }

    return models.data.sort((a, b) => b.created - a.created).flatMap(model => model.id)
}