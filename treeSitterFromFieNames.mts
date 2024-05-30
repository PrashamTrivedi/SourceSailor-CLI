const extensionToTreeSitter = {
    ".c": "tree-sitter-c",
    ".h": "tree-sitter-c",
    ".cpp": "tree-sitter-cpp",
    ".hpp": "tree-sitter-cpp",
    ".cc": "tree-sitter-cpp",
    ".cxx": "tree-sitter-cpp",
    ".c++": "tree-sitter-cpp",
    ".cs": "tree-sitter-c-sharp",
    ".css": "tree-sitter-css",
    ".dart": "tree-sitter-dart",
    ".go": "tree-sitter-go",
    ".js": "tree-sitter-javascript",
    ".mjs": "tree-sitter-javascript",
    ".cjs": "tree-sitter-javascript",
    ".kt": "tree-sitter-kotlin",
    ".kts": "tree-sitter-kotlin",
    ".lua": "tree-sitter-lua",
    ".m": "tree-sitter-objc",
    ".mm": "tree-sitter-objc",
    ".py": "tree-sitter-python",
    ".rb": "tree-sitter-ruby",
    ".rs": "tree-sitter-rust",
    ".svelte": "tree-sitter-svelte",
    ".swift": "tree-sitter-swift",
    ".ts": "tree-sitter-typescript",
    ".tsx": "tree-sitter-typescript",
    ".vue": "tree-sitter-vue",
    ".sh": "tree-sitter-bash",
    ".bash": "tree-sitter-bash"
}

class UnknownLanguageError extends Error {
    constructor (message) {
        super(message)
        this.name = "UnknownLanguageError"
    }
}

function getTreeSitterFromFileName(fileName) {
    const extension = fileName.slice(fileName.lastIndexOf("."))
    const treeSitter = extensionToTreeSitter[extension]

    if (!treeSitter) {
        throw new UnknownLanguageError(`Unknown language for file: ${fileName}`)
    }

    return treeSitter
}

export {getTreeSitterFromFileName, UnknownLanguageError}