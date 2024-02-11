import fs from 'fs'
import path from "path"
const pathsToIgnore = ['.git']
export async function getDirStructure(dirPath, verbose = false) {
    const gitIgnore = fs.readFileSync(`${dirPath}/.gitignore`, 'utf8')
        .split('\n')
        .filter(line => !line.startsWith('#') && line !== '')

    pathsToIgnore.push(...gitIgnore)
    if (verbose) {
        console.log(pathsToIgnore)
    }


    const getAllFiles = dir =>
        fs.readdirSync(dir).reduce((files, file) => {
            const name = path.join(dir, file)
            const isDirectory = fs.statSync(name).isDirectory()

            let shouldIgnore = false
            const pathToCompare = name.replace(`${dirPath}/`, '')
            for (const pattern of pathsToIgnore) {
                // if (verbose && pattern.indexOf('node_modules') !== -1 && entry.name === 'node_modules' || entry.path.indexOf('node_modules') !== -1) {
                //     console.log(`Matches Pattern: ${matchesPattern(pathToCompare, pattern)} against ${pattern}`)
                // }
                if (matchesPattern(pathToCompare, pattern)) {
                    shouldIgnore = true
                    break
                }
            }
            if (!shouldIgnore) {
                return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name]
            } else {
                return []
            }
        }, [])

    const dirToReturn = getAllFiles(dirPath)

    if (verbose) {
        console.log({dirs: JSON.stringify(dirToReturn)})
    }


    return dirToReturn
}

function walkThroughDir(dirs, path, dirToReturn, verbose) {
    // const dirToReturn = {}
    if (verbose) {
        console.log({dirToReturn})
    }
    for (const dir of dirs) {
        const pathToCompare = dir.path.replace(path, '')

        let shouldIgnore = false

        for (const pattern of pathsToIgnore) {
            // if (verbose && pattern.indexOf('node_modules') !== -1 && entry.name === 'node_modules' || entry.path.indexOf('node_modules') !== -1) {
            //     console.log(`Matches Pattern: ${matchesPattern(pathToCompare, pattern)} against ${pattern}`)
            // }
            if (matchesPattern(pathToCompare, pattern)) {
                shouldIgnore = true
                break
            }
        }

        if (!shouldIgnore) {
            const files = dirToReturn[pathToCompare] || []
            files.push(dir.name)
            dirToReturn[pathToCompare] = files


            if (dir.isDirectory()) {
                const subDirs = fs.readdirSync(`${dir.path}/${dir.name}`, {withFileTypes: true})

                walkThroughDir(subDirs, dir.path, dirToReturn[pathToCompare], verbose)
            }
        }


    }
    // return dirToReturn
}

function matchesPattern(path, pattern) {
    const regex = new RegExp(pattern.replace('*', '.*').replace('**', '.*'))
    return regex.test(path)
}