export const prompts = {
    commonSystemPrompt: {
        prompt: `You are a senior software developer who has an experience working with almost all the mainstream programming languages. You can browse through directory structure and read the files containing a codebase. Your job is to create a report that will create an outline of the codebase. The report must include: Programming language used, framework(s) used and the functionality provided by the codebase. If you can figure out the workflows of the app you have to list them out along with relevant code lines.`
    },
    rootUnderstanding:
    {
        prompt: `Based on the given file structure in JSON surrounded by <FileStructure> tag, 
        Please answer following questions
        1. Is the repository a monorepo give me the names of all directoreis which can be the codebases in the monorepo?
        2. If it is a single codebase, what is the programming language and framework used to build this application?
        3. If it is a single codebase, give me the filename where dependencies are defined.
        4. If it is a single codebase, give me the filename which can be the entry point of the application.
        5. If it is a single codebase, guess the possible workflow of the app and give me the workflow.
        6. If it is a single repository, guess the tree sitter language name and give me the language name.

        Please guess the programming language and framework used to build this application. 
        If you think this project is a monorepo consisting multiple codebase, you will guess the role of each directories in the codebase.
        If this is not the monorepo, you will tell me which files to look to understand dependencies of given codebase. You will tell me which file or files to read to get started.`,
        params: {
            description: "Gets following parameters, isMonorepo, directories, programmingLanguage, framework, dependenciesFile, entryPointFile, workflow",
            name: "inferLanguageAndFramework",
            parameters: {
                type: "object",
                properties: {
                    isMonorepo: {
                        type: "boolean",
                        description: "If the repository is monorepo or not"
                    },
                    directories: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "If the repository is monorepo, give me the names of all directoreis which can be the codebases in the monorepo?"
                    },
                    programmingLanguage: {
                        type: "string",
                        description: "If it is a single codebase, what is the programming language used to build this application?"
                    },
                    framework: {
                        type: "string",
                        description: "If it is a single codebase, what is the framework used to build this application?"
                    },
                    dependenciesFile: {
                        type: "string",
                        description: "If it is a single codebase, give me the dependency file e.g. package.json, go.mod, Gemfile, build.gradle, pubspec or podfile."
                    },
                    lockFile: {
                        type: "string",
                        description: "If it is a single codebase, give me the dependency lockfile, e.g. package-lock.json, go.sum, Gemfile.lock, pubspec.lock or podfile.lock."
                    },
                    entryPointFile: {
                        type: "string",
                        description: "If it is a single codebase, give me the filename which can be the entry point of the application."
                    },
                    workflow: {
                        type: "string",
                        description: "If it is a single codebase, guess the possible workflow of the app and give me the workflow."
                    },
                    originalResponse: {
                        type: "object",
                        description: "Original response from the openai"
                    },
                    treeSitterLanguage: {
                        type: "string",

                        description: "If it is a single repository, guess the tree sitter language binding name we can use to parse the source code files. This must always be present"
                    }
                },
                required: ["isMonorepo", "directories", "programmingLanguage", "framework", "dependenciesFile", "lockFile", "entryPointFile", "workflow", "originalResponse", "treeSitterLanguage"]
            }
        }
    },
    dependencyUnderstanding: {
        prompt: "Here is the dependency file structure surrounded by <DependencyFile> tag. Please guess the framweorks used to build this part of application. You will also outline the role and use of each dependency file in the application. And then validate the workflow given to you in <Workflow> tag. Modify the workflow if necessary.",
    },
    fileImports: {
        prompt: "The text <FileStructure> tag, is a content of the code file, Give me the name of the files which are imported in this codebase and the relative path of those files.",
        params: {
            name: "inferImportedFiles",
            description: "Gets following parameters, importedFiles, relativePath",
            parameters: {
                type: "object",
                properties: {
                    importedFiles: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "Name of the file"
                                },
                                relativePath: {
                                    type: "string",
                                    description: "Relative path of the file"
                                }
                            },
                            required: ["name", "relativePath"]
                        }
                    },
                },
                required: ["importedFiles"]
            }
        }
    },
    fileImportsAST: {
        prompt: "Based on AST (Abstract Syntax Tree) of the file surrounded by <FileAST> tag. Give me the name of the files which are imported in this codebase and the relative path of those files.",
        params: {
            name: "inferImportedFiles",
            description: "Gets following parameters, importedFiles, relativePath",
            parameters: {
                type: "object",
                properties: {
                    importedFiles: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "Name of the file"
                                },
                                relativePath: {
                                    type: "string",
                                    description: "Relative path of the file"
                                }
                            },
                            required: ["name", "relativePath"]
                        }
                    },
                },
                required: ["importedFiles"]
            }
        }
    },

    fileStructure:
    {
        prompt: `Based on the JSON file structure of Directory, where Directory name is surrounded by <Dir> tag and File structure is surrounded by <FileStructure> tag.
        Please guess the programming language and framework used to build this part of application.`},

    codeUnderstanding:
    {
        prompt: `Based on the codebase provided to you in <Code> tag. Explain in the consise details what this codebase does. You will also outline the role and use of each file in the application.`
    },
    interestingCodeParts: {
        prompts: `Based on the codebase provided to you in <Code> tag. Please list out the interesting code parts in the codebase. Simply say no if all of the code you found is a common CRUD code.`
    }

}