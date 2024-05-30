import fs from 'fs'
import path from "path"
import ignore from 'ignore'
import {dir} from "console"

const pathsToIgnore = ['.git']
const extentionsToSkipContent = ['.jpg', '.jpeg', '.png', '.gif', '.ico', '.mp4', '.svg', '.pdf', '.doc', '.db', '.sqlite', '.docx', '.xls', '.xlsx']

export interface FileNode {
    name: string
    content: string | undefined | null
    children?: FileNode[]
}

export async function getDirStructure(dirPath: string, otherIgnorePaths: string[], verbose: boolean = false) {

    const isGitingore = fs.existsSync(`${dirPath}/.gitignore`)
    if (isGitingore) {

        const gitIgnore = fs.readFileSync(`${dirPath}/.gitignore`, 'utf8')
            .split('\n')
            .filter(line => !line.startsWith('#') && line !== '')

        pathsToIgnore.push(...gitIgnore)
    }
    if (otherIgnorePaths.length > 0) {
        pathsToIgnore.push(...otherIgnorePaths)
    }
    if (verbose) {
        console.log(pathsToIgnore)
    }

    const ig = ignore.default({
        allowRelativePaths: true,
        ignoreCase: true
    }).add(pathsToIgnore)

    function getJsonFromDirectory(dirPath: string): FileNode | undefined {
        const rootFile: string = dirPath.split('/').pop() || ''
        const result: FileNode = {
            name: rootFile,
            content: null,
            children: []
        }
        const dirPathWithoutRootDir: string = dirPath.substring(dirPath.indexOf('/') + 1)

        let ignoreData = ig
        // Check for .gitignore in the current directory
        const gitignorePath: string = path.join(dirPath, '.gitignore')
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent: string = fs.readFileSync(gitignorePath, 'utf8')
            ignoreData = ig.add(gitignoreContent.split('\n')) // Add new rules to the ignore object
        }

        if (ignoreData.ignores(`${rootFile}/`) || ignoreData.ignores(rootFile)
            || ignoreData.ignores(`${dirPathWithoutRootDir}/`))
            return undefined

        const files: string[] = fs.readdirSync(dirPath)

        for (const file of files) {
            if (ignoreData.ignores(file)) {
                if (verbose) console.log({ignored: file})
                continue
            }

            const fullPath: string = `${dirPath}/${file}`

            const isDirectory: boolean = fs.statSync(fullPath).isDirectory()
            if (isDirectory) {
                const dirChildren = getJsonFromDirectory(fullPath)
                if (dirChildren?.children?.length ?? 0 > 0) {
                    result.children?.push(dirChildren as FileNode)
                }
            } else {
                const filePath: string = `${dirPath}/${file}`
                const fileExtension: string = path.extname(file).toLowerCase()

                if (extentionsToSkipContent.includes(fileExtension)) {
                    result.children?.push({name: file, content: null})
                } else {
                    const fileContent: string = fs.readFileSync(filePath, 'utf8')
                    result.children?.push({name: file, content: fileContent})
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
