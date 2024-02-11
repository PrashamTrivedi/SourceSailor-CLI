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