# SourceSailor

[![NPM Version](https://img.shields.io/npm/v/sourcesailor.svg?logo=npm&label=sourcesailor)](https://www.npmjs.com/package/sourcesailor?activeTab=readme)

[![Testing](https://github.com/PrashamTrivedi/SourceSailor-CLI/actions/workflows/testAndReport.yml/badge.svg)](https://github.com/PrashamTrivedi/SourceSailor-CLI/actions/workflows/testAndReport.yml/badge.svg)

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

Set up the API keys and default models for SourceSailor:

```bash
SourceSailor setup --apiKey <your_api_key> [--model <model_name>] [--analysisDir <directory>] [--anthropicApiKey <your_anthropic_api_key>] [--geminiApiKey <your_gemini_api_key>]
```

Options:
- `--apiKey`, `-k`: OpenAI API Key (required)
- `--model`, `-m`: Default AI Model (default: 'gpt-3.5-turbo')
- `--analysisDir`, `-a`: Root directory to write the analysis. Default is the home directory. Use 'p' to use the codebase directory.
- `--anthropicApiKey`, `-n`: Anthropic API Key
- `--geminiApiKey`, `-g`: Gemini API Key

#### Get Directory Structure

Get the directory structure of the given path:

```bash
SourceSailor dirStructure <path|p> [--verbose] [--withContent] [--ignore]
```

Positional arguments:
- `<path>`, `-p`: Path to the directory to analyze (required)

Options:
- `--verbose`, `-v`: Run with verbose logging (default: false)
- `--withContent`, `-c`: Include file content in the output (default: true)
- `--ignore`, `-i`: Additional files or patterns to ignore for analysis. You can pass multiple patterns separated by commas (default: none)

#### Analyze

Analyze the given directory structure to understand the project structure and dependencies:

```bash
SourceSailor analyse <path> [--verbose] [--streaming] [--ignore] [--model]
```

Positional arguments:
- `<path>`, `-p`: Path to the directory to analyze (required)

Options:
- `--verbose`, `-v`: Run with verbose logging (default: false)
- `--streaming`, `-s`: Use AI streaming to infer project structure (default: false)
- `--ignore`, `-i`: Additional files or patterns to ignore for analysis. You can pass multiple patterns separated by commas (default: none)
- `--model`, `-m`: Specify the AI model to use for analysis

#### List Models

List all available AI models:

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

Update the API keys and default model:

```bash
SourceSailor updateConfig [--apiKey <api_key>] [--model <model_name>] [--analysisDir <directory>] [--geminiApiKey <gemini_api_key>] [--anthropicApiKey <anthropic_api_key>]
```

Options:
- `--apiKey`, `-k`: OpenAI API Key
- `--model`, `-m`: Default AI Model
- `--analysisDir`, `-a`: Root directory to write the analysis. Default is the home directory. Use 'p' to use the codebase directory.
- `--geminiApiKey`, `-g`: Gemini API Key
- `--anthropicApiKey`, `-n`: Anthropic API Key

#### Set User Expertise

Set your expertise level for various programming languages and frameworks:

```bash
SourceSailor setExpertise
```

This interactive command will guide you through setting your expertise levels for different programming languages and frameworks. This information helps SourceSailor provide more tailored analysis and reports.

#### Prepare Report

Prepare a report based on the analysis:

```bash
SourceSailor prepareReport <path> [--verbose] [--streaming] [--model]
```

Positional arguments:
- `<path>`, `-p`: Path to the analysis (required)

Options:
- `--verbose`, `-v`: Enable verbose output
- `--streaming`, `-s`: Stream the output to a file
- `--model`, `-m`: Specify the AI model to use for report generation

Use the `SourceSailor --help` command to see the full list of available commands and options.

## About the Code

The SourceSailor-CLI tool is structured around several key components, each serving a specific purpose in the code analysis process:

- **Commands Directory**: Contains various CLI commands like `analyse.mjs`, `listConfig.mjs`, and more, which implement the tool's functionality.
- **AI Integration**: Includes modules for OpenAI (`openai.mjs`), Google's Gemini (`gemini.mts`), and Anthropic (`anthropic.mts`) to perform advanced code analysis.
- **Dynamic Command Handling**: Employs Yargs for building a flexible CLI interface, making it user-friendly and adaptable to various user needs.
- **Configurable Analysis Directory**: Allows users to specify directories for storing analysis results, adding a layer of customization.
- **User Expertise Levels**: The `expertise.mjs` module manages user expertise levels for different programming languages and frameworks, enhancing the tool's analysis capabilities.
- **Model Utils**: The `modelUtils.mts` file provides a unified interface for managing different AI models and providers.


## :construction: Next Steps

- Iterate through prompts (Will be ongoing evaluation)
- Use Openrouter to switch models (Not planning to use, will switch to Gemini and Claude for future versions, may be by using plugins)
- Use more prompts and CoT to work around the project (Will be ongoing evaluation) 
- Add Plug and Play architecture for various model providers (Openrouter, AWS Bedrock, Google Vertex and Mistral are in my mind)
- 🤔 Customizable prompts
- ✅ Add Anthropic and Gemini models (See [#3](https://github.com/PrashamTrivedi/SourceSailor-CLI/issues/3) and [#2](https://github.com/PrashamTrivedi/SourceSailor-CLI/issues/2) respectively)
- ✅ Write some reports per prompt and then pass it to CoT to generate a confident report (Already in the code)
- Use the report as RAG. :bulb: (Highly speculative)
- ✅ Use CLI decorators like colors and other decorators
- ✅ Customised additional ignore list, AKA passing those files like we pass in gitignore
- ✅  [NPM Package](https://www.npmjs.com/package/sourcesailor?activeTab=readme)

