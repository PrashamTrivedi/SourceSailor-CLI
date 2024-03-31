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

export function writeAnalysis(projectRoot, analysisName, analysisContent, isJson = false) {
    const analysisDir = path.join(projectRoot, '.SourceSailor', 'analysis')
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