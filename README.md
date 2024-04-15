# SourceSailor

[![NPM Version](https://img.shields.io/npm/v/sourcesailor.svg?logo=npm&label=sourcesailor)](https://www.npmjs.com/package/sourcesailor?activeTab=readme)


Navigate through your source code with ease.


## About

SourceSailor-CLI is a sophisticated command-line interface (CLI) tool designed for developers to analyze and understand their codebases more effectively. Built with JavaScript and powered by the Node.js runtime, it integrates with OpenAI's API and employs Tree-Sitter grammars for parsing, making it capable of handling a wide variety of programming languages. This tool streamlines the process of analyzing project structures, dependencies, and code quality, providing valuable insights through generated reports.

## :construction: Installation and Usage

To get started with SourceSailor-CLI, ensure you have Node.js installed on your system. Follow these steps to install and use the tool:

### Installation

Install this CLI using 

```bash
npm install -g sourcesailor
```

### Commands

#### Setup

Set up the OpenAI API key and default model for SourceSailor:

```bash
SourceSailor setup --apiKey <your_api_key> [--model <model_name>] [--analysisDir <directory>]
```

Options:
- `--apiKey`, `-k`: OpenAI API Key (required)
- `--model`, `-m`: OpenAI Model (default: 'gpt-3.5-turbo')
- `--analysisDir`, `-a`: Root directory to write the analysis. Default is the home directory. Use 'p' to use the codebase directory. (default: home directory)

#### Analyze

Analyze the given directory structure to understand the project structure and dependencies:

```bash
SourceSailor analyse <path> [--verbose] [--openai] [--streaming]
```

Positional arguments:
- `<path>`, `-p`: Path to the directory to analyze (required)

Options:
- `--verbose`, `-v`: Run with verbose logging (default: false)
- `--openai`, `-o`: Use OpenAI to infer project structure (default: true)
- `--streaming`, `-s`: Use OpenAI streaming to infer project structure (default: false)

#### List Models

List all available OpenAI models:

```bash
SourceSailor listModels [--verbose]
```

Options:
- `--verbose`, `-v`: Enable verbose output

#### List Config

List all available configurations:

```bash
SourceSailor listConfig [--verbose]
```

Options:
- `--verbose`, `-v`: Enable verbose output

#### Update Config

Update the OpenAI API key and default model:

```bash
SourceSailor updateConfig [--apiKey <api_key>] [--model <model_name>] [--analysisDir <directory>]
```

Options:
- `--apiKey`, `-k`: OpenAI API Key
- `--model`, `-m`: OpenAI Model
- `--analysisDir`, `-a`: Root directory to write the analysis. Default is the home directory. Use 'p' to use the codebase directory.

#### Prepare Report

Prepare a report based on the analysis:

```bash
SourceSailor prepareReport <path> [--verbose] [--streaming]
```

Positional arguments:
- `<path>`, `-p`: Path to the analysis (required)

Options:
- `--verbose`, `-v`: Enable verbose output
- `--streaming`, `-s`: Stream the output to a file

Use the `SourceSailor --help` command to see the full list of available commands and options.


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
- (Done) [NPM Package](https://www.npmjs.com/package/sourcesailor?activeTab=readme)