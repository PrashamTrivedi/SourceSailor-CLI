import fs from 'fs'
import path from "path"
import ignore from 'ignore'
import {dir} from "console"

const pathsToIgnore = ['.git']
const extentionsToSkipContent = ['.jpg', '.jpeg', '.png', '.gif', '.ico', '.mp4', '.svg', '.pdf', '.doc', '.db', '.sqlite', '.docx', '.xls', '.xlsx']

export async function getDirStructure(dirPath, otherIgnorePaths, verbose = false) {

    const isGitingore = fs.existsSync(`${dirPath}/.gitignore`)
    if (isGitingore) {

        const gitIgnore = fs.readFileSync(`${dirPath}/.gitignore`, 'utf8')
            .split('\n')
            .filter(line => !line.startsWith('#') && line !== '')

        pathsToIgnore.push(...gitIgnore)
    }
    if (Array.isArray(otherIgnorePaths) && otherIgnorePaths.length > 0) {
        pathsToIgnore.push(...otherIgnorePaths)
    }
    if (verbose) {
        console.log(pathsToIgnore)
    }

    const ig = ignore({
        allowRelativePaths: true,
        ignoreCase: true
    }).add(pathsToIgnore)

    function getJsonFromDirectory(dirPath) {
        const rootFile = dirPath.split('/').pop()
        const result = {
            name: rootFile,
            children: []
        }
        const dirPathWithoutRootDir = dirPath.substring(dirPath.indexOf('/') + 1)

        let ignoreData = ig
        // Check for .gitignore in the current directory
        const gitignorePath = path.join(dirPath, '.gitignore')
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
            ignoreData = ig.add(gitignoreContent.split('\n')) // Add new rules to the ignore object
        }

        if (ignoreData.ignores(`${rootFile}/`) || ignoreData.ignores(rootFile) || ignoreData.ignores(`${dirPathWithoutRootDir}/`)) return {}

        const files = fs.readdirSync(dirPath)

        for (const file of files) {
            if (ignoreData.ignores(file)) {
                if (verbose) console.log({ignored: file})
                continue
            }


            const fullPath = `${dirPath}/${file}`

            const isDirectory = fs.statSync(fullPath).isDirectory()
            if (isDirectory) {
                const dirChildren = getJsonFromDirectory(fullPath)
                if (dirChildren?.children?.length ?? 0 > 0) {
                    result.children.push(dirChildren)
                }
            } else {
                const filePath = `${dirPath}/${file}`
                const fileExtension = path.extname(file).toLowerCase()


                if (extentionsToSkipContent.includes(fileExtension)) {
                    result.children.push({name: file, content: null})
                } else {
                    const fileContent = fs.readFileSync(filePath, 'utf8')
                    result.children.push({name: file, content: fileContent})
                }
            }
        }

        return result
    }



    const dirToReturn = getJsonFromDirectory(dirPath)

    if (verbose) {
        console.log({dirs: JSON.stringify(dirToReturn)})
    }


    return dirToReturn
}

function matchesPattern(path, pattern) {
    const regex = new RegExp(pattern.replace('*', '.*').replace('**', '.*'))
    return regex.test(path)
}