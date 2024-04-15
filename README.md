# SourceSailor

Navigate through your source code with ease.


## About

SourceSailor-CLI is a sophisticated command-line interface (CLI) tool designed for developers to analyze and understand their codebases more effectively. Built with JavaScript and powered by the Node.js runtime, it integrates with OpenAI's API and employs Tree-Sitter grammars for parsing, making it capable of handling a wide variety of programming languages. This tool streamlines the process of analyzing project structures, dependencies, and code quality, providing valuable insights through generated reports.

## :construction: Installation and Usage

To get started with SourceSailor-CLI, ensure you have Node.js installed on your system. Follow these steps to install and use the tool:

1. **Clone the repository** to your local machine using Git.
2. **Navigate to the project directory** where the `package.json` file is located.
3. **Run `npm install`** to install the necessary dependencies.
4. **Set up the CLI** with your OpenAI API key using the `setup.mjs` command. This step is crucial for enabling the tool to perform code analysis.
5. **Use the CLI commands** to analyze your projects, manage configurations, and generate reports. For example, you can start an analysis with the `analyse.mjs` command followed by the path to your project directory.



## About the Code

The SourceSailor-CLI tool is structured around several key components, each serving a specific purpose in the code analysis process:

- **Commands Directory**: Contains various CLI commands like `analyse.mjs`, `listConfig.mjs`, and more, which implement the tool's functionality.
- **OpenAI Integration**: The `openai.mjs` module interfaces with the OpenAI API, enabling the tool to perform advanced code analysis.
- :brain: **Tree-Sitter Parsing**: Utilizes Tree-Sitter grammars in `treeParser.mjs` and `treeSitterFromFieNames.mjs` for accurate code parsing across different languages.
- **Dynamic Command Handling**: Employs Yargs for building a flexible CLI interface, making it user-friendly and adaptable to various user needs.
- **Configurable Analysis Directory**: Allows users to specify directories for storing analysis results, adding a layer of customization.

## :construction: Next Steps

- Iterate through prompts (Will be ongoing evaluation)
- Use Openrouter to switch models (Not planning to use, will switch to Gemini and Claude for future versions, may be by using plugins)
- Use more prompts and CoT to work around the project (Will be ongoing evaluation) 
- Use tree sitter to get better ideas of the project and codebase :brain: (Can be core functionality of the CLI) (Already in the code)
- Write some reports per prompt and then pass it to CoT to generate a confident report (Already in the code)
- Use the report as RAG. :bulb: (Highly speculative)
- Use CLI decorators like colors and other decorators
- Customised additional ignore list, AKA passing those files like we pass in gitignore
- (COMING SOONish) NPM Package