import fs from 'fs'
import path from "path"
import ignore from 'ignore'
import {dir} from "console"

const pathsToIgnore = ['.git']
export async function getDirStructure(dirPath, verbose = false) {

    const isGitingore = fs.existsSync(`${dirPath}/.gitignore`)
    if (isGitingore) {

        const gitIgnore = fs.readFileSync(`${dirPath}/.gitignore`, 'utf8')
            .split('\n')
            .filter(line => !line.startsWith('#') && line !== '')

        pathsToIgnore.push(...gitIgnore)
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



        if (ig.ignores(`${rootFile}/`) || ig.ignores(rootFile) || ig.ignores(`${dirPathWithoutRootDir}/`)) return {}

        const files = fs.readdirSync(dirPath)

        for (const file of files) {
            if (ig.ignores(file)) {
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
                const fileContent = fs.readFileSync(filePath, 'utf8')

                result.children.push({name: file, content: fileContent})
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