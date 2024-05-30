import fs from 'fs'
import parser from 'tree-sitter'
import {calculateTokens} from "./openai"
const availableTypes = ['import_statement', 'require_call', 'exports', 'dynamicLinks', "lexical_declaration", "expression_statement", 'function_definition', 'method_definition', 'class_definition']
export const parseTree = async (file, language, isVerbose = false) => {
    try {
        const fileContents = await fs.promises.readFile(file, 'utf-8')
        const tokens = await calculateTokens([{content: fileContents, role: 'user'}])
        if (isVerbose) {
            console.log(`Tokens: ${tokens}`)
        }
        if (tokens < 1000) {

            return {contents: fileContents, isAst: false}
        }
        if (isVerbose) {
            console.log(`Parsing ${file}`)
        }
        return await analyseFileContents(language, isVerbose, fileContents)
    } catch (error) {

        console.error('Error reading file:', error)
    }
}

export const analyseFileContents = async (language, isVerbose, fileContents) => {
    const codeParser = new parser()
    if (!language || language.length === 0) {
        throw new Error('Language is required to parse the file')
    }
    const normalizedLanguage = language.startsWith('tree-sitter') ? language : `tree-sitter-${language.toLowerCase()}`


    if (isVerbose) {
        console.log(`Parsing file with ${normalizedLanguage}`)
    }
    const languageModule = await import(normalizedLanguage)

    codeParser.setLanguage(languageModule.default)
    const tree = codeParser.parse(fileContents)
    // tree.printDotGraph()
    const rootNode = tree.rootNode


    const sourceTree = getTree(rootNode)

    return JSON.stringify(sourceTree)
}

function getTree(node) {

    const tree = {
        children: [],
        text: node.text,
        type: node.type,
        start: node.startIndex,
        end: node.endIndex,
        startPosition: node.startPosition,
        endPosition: node.endPosition,
    }
    for (const child of node.children) {
        if (availableTypes.includes(child.type)) {
            tree.children.push(getTree(child))
        }
    }
    return tree
}