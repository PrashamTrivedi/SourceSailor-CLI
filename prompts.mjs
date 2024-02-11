export const prompts = {
    rootUnderstanding:
        `Based on the given file structure in JSON surrounded by <FileStructure> tag, 
        Please guess the programming language and framework used to build this application. 
        If you think this project is a monorepo consisting multiple codebase, you will guess the role of each directories in the codebase.
        If this is not the monorepo, you will tell me which files to look to understand dependencies of given codebase. You will tell me which file or files to read to get started.`,
    fileStructure:
        `Based on the JSON file structure of Directory, where Directory name is surrounded by <Dir> tag and File structure is surrounded by <FileStructure> tag.
        Please guess the programming language and framework used to build this part of application.`,


}