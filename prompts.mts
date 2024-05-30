interface Property {
    type: string
    description: string
}

interface Item {
    type: string
    properties?: Record<string, Property>
    required?: string[]
}

interface MainProperty extends Property {
    items?: Item
}

type Properties = Record<string, MainProperty>
interface Prompt {
    prompt: string
    params?: {
        description: string
        name: string
        parameters: Record<string, any>
    }
}

export const prompts: Record<string, Prompt> = {
    commonSystemPrompt: {
        prompt: `You are a senior software developer who has an experience working with almost all the mainstream programming languages. You can browse through directory structure and read the files containing a codebase. Your job is to create a report that will help a developer who is getting started with this codebase. To help the developer, you will create a report which must include: Programming language used, framework(s) used and the functionality provided by the codebase. If you can figure out the workflows of the app you have to list them out along with relevant code lines.`
    },
    rootUnderstanding:
    {
        prompt: `Based on the given file structure in JSON surrounded by <FileStructure> tag, 
        Please answer following questions.
        1. If this repository is a monorepo or not. A repository is not a monorepo if there is a dependency file at the root of the codebase, even if there is a folder which contains it's own dependency file. 
        2. If the repository is a monorepo give me the names of all directoreis which can be the codebases in the monorepo?
        3. If it is a single codebase, what is the programming language and framework used to build this application?
        4. If it is a single codebase, give me the filename where dependencies are defined.
        5. If it is a single codebase, give me the filename which can be the entry point of the application.
        6. If it is a single codebase, tell me the possible workflow of the app and give me the workflow.
        7. If it is a single repository, tell me the tree sitter language name and give me the language name.

        Please Tell me the programming language and framework used to build this application. 
        If this project is a monorepo consisting multiple codebase, you will tell me the role of each directories in the codebase.
        If this is not the monorepo, you will tell me which files to look to understand dependencies of given codebase. You will tell me which file or files to read to get started. When you don't have any information, always pass blank string.`,
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
                        description: "If it is a single codebase, the possible workflow of the app and give me the workflow."
                    },
                    originalResponse: {
                        type: "object",
                        description: "Original response from the openai"
                    },
                    treeSitterLanguage: {
                        type: "string",

                        description: "If it is a single repository, the tree sitter language binding name we can use to parse the source code files. This must always be present"
                    }
                },
                required: ["isMonorepo", "directories", "programmingLanguage", "framework", "dependenciesFile", "lockFile", "entryPointFile", "workflow", "originalResponse", "treeSitterLanguage"]
            }
        }
    },
    dependencyUnderstanding: {
        prompt: "Here is the dependency file structure surrounded by <DependencyFile> tag. Tell me the framweorks used to build this part of application. You will also outline the role and use of each dependency file in the application. And then validate the workflow given to you in <Workflow> tag. Modify the workflow if necessary.",
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
        Tell me the programming language and framework used to build this part of application.`},

    codeUnderstanding:
    {
        prompt: `Based on the codebase provided to you in <Code> tag. Explain in the concise details what this codebase does. You will also outline the role and use of each file in the application.`
    },
    interestingCodeParts: {
        prompt: `You are a senior software developer who has an experience working with almost all the mainstream programming languages. Based on the codebase provided to you in <Code> tag. List out the interesting parts of code. The definition of interesting part is, The interesting code is the code which is not common CRUD, it solves some issues uniquely. If this project doesn't have something interesting, simply say: I didn't find anything interesting in this codebase.`
    },
    codeUnderstandingAST: {
        prompt: `Based on the limited AST of the codebase provided to you in <CodeAST> tag, which represents the shape of the code. Explain in concise detail what this codebase does. You will also outline the role and use of each major component in the application.`
    },

    interestingCodePartsAST: {
        prompt: `You are a senior software developer who has experience working with almost all the mainstream programming languages. Based on the limited AST of the codebase provided to you in <CodeAST> tag, which represents the shape of the code, list out the interesting code parts of code. The definition of interesting part is, The interesting code is the code which is not common CRUD and solving some issues uniquely.  If this project doesn't have something interesting based on the AST, simply say: I didn't find anything particularly interesting in the structure of this codebase.`
    },

    consolidatedInferrenceForMonoRepo: {
        prompt: `You have the inferrence information for all the repos of given monorepo, surrounded by <MonoRepoInferrence> tag. Based on this, generate a following sections for each repo in the monorepo for readme file. The sections must be: About, Installation and Usage, About the Code. Only return relevant markdown for the sections.`
    },

    readmePrompt: {
        prompt: `You have Directory Structure surrounded by <DirectoryStructure> tag,dependency Inferrence surrounded by <DependencyInferrence> and code inferrence report surrounded by <CodeInferrence> tag. Generate following sections for readme file based on the given information. The sections must be: About, Installation and Usage, About the Code. Only return relevant markdown for the sections.`
    }

}