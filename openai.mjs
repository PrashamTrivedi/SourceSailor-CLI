
import OpenAI from 'openai'

import {get_encoding} from "tiktoken"

import {Stream} from "openai/streaming"
import {prompts} from "./prompts.mjs"
import {readConfig} from "./utils.mjs"


async function calculateTokens(messages) {
    const chatMessages = messages.filter(message => message.content?.length ?? 0 > 0).map(message => message.content)
    const enc = await get_encoding("cl100k_base")
    const tokens = enc.encode(chatMessages.join('\n'))
    return tokens.length

}
async function getModel(useOpenAi, isVerbose = false) {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    if (useOpenAi) {
        const models = await openai.models.list()
        const gpt4 = models.data.find(model => model.id === process.env.DEFAULT_OPENAI_MODEL ?? 'gpt-4-0125-preview')
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
    {name: 'gpt-4-0125-preview	', limit: 128000},
    {name: 'gpt-4-1106-preview	', limit: 128000},
    {name: 'gpt-4-turbo-preview	', limit: 128000},
    {name: 'gpt-3.5-turbo', limit: 4000},
    {name: 'gpt-3.5-turbo-16k', limit: 16000}
]

export const inferProjectDirectory = async (projectDirectory, useOpenAi = true, isStreaming = false, isVerbose = false) => {
    const openai = getOpenAiClient(useOpenAi, isVerbose)
    const compatibilityMessage = [{
        role: "system",
        content: prompts.rootUnderstanding.prompt

    }, {
        role: "user",
        content: `<FileStructure>${JSON.stringify(projectDirectory)}</FileStructure>`
    }]
    if (isVerbose) {
        console.log(`System Prompt: ${prompts.rootUnderstanding.prompt}`)
        console.log(`User Prompt: ${JSON.stringify(projectDirectory)}`)
    }
    const tokens = await calculateTokens(compatibilityMessage)
    const modelLimit = modelLimits.find(modelLimit => modelLimit.name >= 'gpt-4')
    const modelLimitTokens = modelLimit?.limit ?? 0
    if (isVerbose) {
        console.log(`Model limit: ${modelLimitTokens}, Tokens: ${tokens}`)
    }
    if (modelLimitTokens < tokens) {
        throw new Error(`Job description is too long. It has ${tokens} tokens, but the limit is ${modelLimit?.limit}`)
    }
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
    const model = await getModel(useOpenAi)
    const matchJson = await openai.chat.completions.create({
        model,
        messages: compatibilityMessage,
        temperature: 0,
        // stream: isStreaming,
        tools: tools,
        tool_choice: "auto"
    })


    //     // console.log()
    //     return matchJson.choices[0].message?.tool_calls?.
    //         flatMap(toolCall => toolCall?.function?.arguments)
    // } else {
    if (isVerbose) {
        console.log(JSON.stringify(matchJson.choices[0], null, 2))
    }

    if (matchJson.choices[0].finish_reason === 'tool_calls') {

        const response = matchJson.choices[0].message?.tool_calls?.
            flatMap(toolCall => toolCall?.function?.arguments)
        return response?.join('')
    }
    // Handle the JSON response from the API
    return matchJson.choices[0].message.content || undefined



}

export const listModels = async (isVerbose = false) => {

    const openai = getOpenAiClient(true, isVerbose)
    const models = await openai.models.list()

    if (isVerbose) {
        console.log(models.data)
    }

    return models.data.sort((a, b) => b.created - a.created).flatMap(model => model.id)
}