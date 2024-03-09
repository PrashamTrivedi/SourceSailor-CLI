export const prompts = {
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
                        description: "If it is a single codebase, give me the filename where dependencies are defined."
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
                required: ["isMonorepo", "directories", "programmingLanguage", "framework", "dependenciesFile", "entryPointFile", "workflow", "originalResponse", "treeSitterLanguage"]
            }
        }
    },
    dependencyUnderstanding: {
        prompt: "Here is the dependency file structure surrounded by <DependencyFile> tag. Please guess the framweorks used to build this part of application. You will also outline the role and use of each dependency file in the application. And then validate the workflow given to you in <Workflow> tag. Modify the workflow if necessary.",
    },

    fileStructure:
    {
        prompt: `Based on the JSON file structure of Directory, where Directory name is surrounded by <Dir> tag and File structure is surrounded by <FileStructure> tag.
        Please guess the programming language and framework used to build this part of application.`},


}