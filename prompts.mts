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
    commonMarkdownPrompt: {
        prompt: ` make it pretty with colors and boxes to make it pleasant and readable as markdown`
    },
    commonSystemPrompt: {
        prompt: `You are a senior software developer who has an experience working with almost all the mainstream programming languages. 
        You can browse through directory structure and read the files of a codebase. 
        Your job is to create a report that will help a developer who is getting started with this codebase. 
        The report must include: Programming language used, framework(s) used and the functionality provided by the codebase, this is essential for the developer.
        If you can figure out the workflows of the app you have to list them out along with relevant code lines.
        The developer who is using this report has set their expertise in <Expertise> tag, 
        Adapt the depth and complexity of your explanations based on the developer's expertise.
        Adjust technical details and terminology accordingly without explicitly mentioning or discussing the developer's skill level.`
    },
    rootUnderstanding:
    {
        prompt: `Based on the given file structure in JSON surrounded by <FileStructure> tag, 
        Answer following questions.
        1. Is this repository is a monorepo or not. A repository is not a monorepo if there is a dependency file at the root of the codebase, even if there is a folder which contains it's own dependency file. 
        2. Is the repository is a monorepo give me the names of all directoreis which can be the codebases in the monorepo?
        3. If it is a single codebase, give me the programming language and framework used to build this application?
        4. If it is a single codebase, give me the filename where dependencies are defined.
        5. If it is a single codebase, give me the filename which can be the entry point of the application.
        6. If it is a single codebase, give me the possible workflow of the app and give me the workflow.
      
        If this project is a monorepo consisting multiple codebase, you will tell me the role of each directories in the codebase.Pass blank string if you can't infer anything/.`,
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
                    }
                },
                required: ["isMonorepo", "directories", "programmingLanguage", "framework", "dependenciesFile", "lockFile", "entryPointFile", "workflow", "originalResponse"]
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

    fileStructure:
    {
        prompt: `Based on the JSON file structure of Directory, where Directory name is surrounded by <Dir> tag and File structure is surrounded by <FileStructure> tag.
        Tell me the programming language and framework used to build this part of application.`},

    codeUnderstanding:
    {
        prompt: `Based on the codebase provided to you in <Code> tag. Explain in the concise details what this codebase does. You will also outline the role and use of each file in the application.`
    },
    interestingCodeParts: {
        prompt: `You are a senior software developer who has an experience working with almost all the mainstream programming languages. 
        Based on the codebase provided to you in <Code> tag. 
        List out the interesting parts of code. 
        The definition of interesting part is, The interesting code is the code which is not common CRUD, it solves some issues uniquely. 
        If this project doesn't have something interesting, simply say: I didn't find anything interesting in this codebase.
        Tailor your explanations of the interesting code based on the developer's expertise provided in the <Expertise> tag. 
        Adjust the depth, complexity, and terminology of your explanations accordingly, without explicitly referencing or discussing the developer's skill level.

        For each interesting code segment:
        1. Briefly describe its purpose
        2. Explain why it's noteworthy
        3. Provide relevant code snippets or file references

        Present your findings in a clear, concise manner that aligns with the developer's background, focusing on practical insights that will enhance their understanding of the codebase.
        `
    },

    consolidatedInferrenceForMonoRepo: {
        prompt: `You have the inferrence information for all the repos of given monorepo, surrounded by <MonoRepoInferrence> tag. Based on this, generate a following sections for each repo in the monorepo for readme file. The sections must be: About, Installation and Usage, About the Code. Only return relevant markdown for the sections.`
    },

    readmePrompt: {
        prompt: `You have Directory Structure surrounded by <DirectoryStructure> tag,dependency Inferrence surrounded by <DependencyInferrence> and code inferrence report surrounded by <CodeInferrence> tag. Generate following sections for readme file based on the given information. The sections must be: About, Installation and Usage, About the Code. Only return relevant markdown for the sections.`
    }

}