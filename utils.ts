import fs from 'fs'
import os from 'os'
import path from 'path'

export function readConfig() {
    const homeDir = os.homedir()
    const configFile = path.join(homeDir, '.SourceSailor', 'config.json')
    if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
        return config
    }
    return {}
}

export function addAnalysisInGitIgnore(projectRoot) {
    // First check if the project root has gitignore file, if the file is not found don't create one.
    // If the file is found, append .SourceSailor/analysis to the file.
    const gitignoreFile = path.join(projectRoot, '.gitignore')
    if (fs.existsSync(gitignoreFile)) {
        const gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8')
        if (!gitignoreContent.includes('.SourceSailor/analysis')) {
            fs.appendFileSync(gitignoreFile, '\n.SourceSailor/analysis')
        }
    }
}

export function writeAnalysis(projectRoot, analysisName, analysisContent, isJson = false, isProjectRoot = false) {
    const analysisDir = isProjectRoot ? path.join(projectRoot, '.SourceSailor', 'analysis') : path.join(projectRoot, 'analysis')
    if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, {recursive: true})
    }
    if (isJson) {
        const analysisFile = path.join(analysisDir, `${analysisName}.json`)
        fs.writeFileSync(analysisFile, JSON.stringify(analysisContent, null, 4))
    } else {
        const analysisFile = path.join(analysisDir, `${analysisName}.md`)
        fs.writeFileSync(analysisFile, analysisContent)
    }
}

export function writeError(projectRoot, errorType, errorContent, errorMssage) {
    const errorDir = path.join(projectRoot, 'errors')
    if (!fs.existsSync(errorDir)) {
        fs.mkdirSync(errorDir, {recursive: true})
    }
    const errorFile = path.join(errorDir, `${errorType}.txt`)


    fs.writeFileSync(errorFile, `${errorContent}\n\n${errorMssage}`)
}

export function getAnalysis(projectRoot, isProjectRoot) {
    const analysis = {}
    const analysisDir = isProjectRoot ? path.join(projectRoot, '.SourceSailor', 'analysis') : path.join(projectRoot, 'analysis')
    if (!fs.existsSync(analysisDir)) {
        return analysis
    }
    const entries = fs.readdirSync(analysisDir)

    for (const entry of entries) {
        const fullPath = path.join(analysisDir, entry)
        const isDirectory = fs.statSync(fullPath).isDirectory()

        const fileName = path.basename(entry, path.extname(entry))
        if (isDirectory) {
            analysis[fileName] = getAnalysis(fullPath, false)
        } else {
            analysis[fileName] = fs.readFileSync(fullPath, 'utf-8')
        }
    }
    return analysis
}