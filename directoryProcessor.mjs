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

    const ig = ignore().add(pathsToIgnore)

    function getJsonFromDirectory(dirPath) {
        if (verbose) console.log({dirPath})
        const rootFile = dirPath.split('/').pop()
        if (dirPath !== '.' && ig.ignores(`${rootFile}/`)) return {}
        const files = fs.readdirSync(dirPath)
        const filesWithoutIgnored = files.filter(file => !ig.ignores(file))
        const json = {}
        if (verbose) console.log({filesWithoutIgnored})
        json[rootFile] = filesWithoutIgnored
        for (const file of filesWithoutIgnored) {
            const fullPath = `${dirPath}/${file}`

            const isDirectory = fs.statSync(fullPath).isDirectory()
            if (isDirectory) {
                json[file] = getJsonFromDirectory(fullPath)
                if (verbose) console.log({jsonData: json, file})
            }

        }
        return json
    }
    // function pathsToTree(paths, separator = '/') {
    //     let tree = {}
    //     paths.forEach(path => {
    //         let pathParts = path.split(separator)
    //         let currentLevel = tree
    //         pathParts.forEach((part, index) => {
    //             if (index === pathParts.length - 1) {
    //                 if (!currentLevel['_files']) {
    //                     currentLevel['_files'] = []
    //                 }
    //                 currentLevel['_files'].push(part)
    //             } else {
    //                 if (!currentLevel[part]) {
    //                     currentLevel[part] = {}
    //                 }
    //                 currentLevel = currentLevel[part]
    //             }
    //         })
    //     })
    //     return tree
    // }


    // const getAllFiles = (dir) => {
    //     const files = fs.readdirSync(dir).reduce((files, file) => {
    //         const name = path.join(dir, file)
    //         const isDirectory = fs.statSync(name).isDirectory()
    //         const relativePath = path.relative(dirPath, name)

    //         if (ig.ignores(relativePath)) {
    //             return files
    //         }

    //         return isDirectory ? [...files, ...getAllFiles(name)] : [...files, relativePath]
    //     }, [])

    //     return files
    // }



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