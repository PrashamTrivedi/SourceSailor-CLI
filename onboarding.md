# SourceSailor CLI - Developer Onboarding Guide

Welcome to SourceSailor CLI! This comprehensive guide will help you understand the codebase, get it running, and start contributing effectively.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Getting Started](#getting-started)
4. [Architecture & Code Structure](#architecture--code-structure)
5. [User Journey](#user-journey)
6. [System Flow](#system-flow)
7. [Key Components Deep Dive](#key-components-deep-dive)
8. [Coding Standards & Conventions](#coding-standards--conventions)
9. [Testing](#testing)
10. [Building & Deployment](#building--deployment)
11. [Contributing](#contributing)
12. [Gotchas & Tricky Parts](#gotchas--tricky-parts)

---

## Project Overview

SourceSailor CLI is a sophisticated command-line tool that helps developers analyze and understand codebases using AI-powered analysis. It integrates with multiple AI providers (OpenAI, Google Gemini, and Anthropic) to generate comprehensive reports about project structure, dependencies, and code patterns.

### What It Does
- Analyzes directory structures and identifies project type (monorepo vs single codebase)
- Infers programming languages, frameworks, and workflows
- Analyzes dependencies and their purposes
- Identifies interesting code patterns and unique implementations
- Generates comprehensive documentation and reports
- Supports multiple AI model providers with a unified interface

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (ES2020)
- **Language**: TypeScript with `.mts` extension (ESM modules)
- **Module System**: ES Modules (type: "module" in package.json)
- **CLI Framework**: Yargs for command parsing
- **Testing**: Vitest with Istanbul coverage

### Key Dependencies
- **AI SDKs**:
  - `@anthropic-ai/sdk`: ^0.32.0 (Anthropic Claude integration)
  - `@google/generative-ai`: ^0.21.0 (Google Gemini integration)
  - `openai`: ^4.33.1 (OpenAI GPT integration)

- **CLI Tools**:
  - `yargs`: ^17.7.2 (CLI argument parsing)
  - `inquirer` + `@inquirer/prompts`: Interactive prompts
  - `ora`: ^8.0.1 (Spinners for loading states)
  - `chalk`: ^5.3.0 (Terminal styling)
  - `cli-markdown`: ^3.4.0 (Markdown rendering in terminal)

- **Utilities**:
  - `ignore`: ^5.3.1 (Gitignore pattern matching)
  - `tiktoken`: ^1.0.13 (Token counting for AI models)
  - `axios`: ^1.7.4 (HTTP requests)

### Development Tools
- **TypeScript**: ^5.4.5 with strict mode enabled
- **ESLint**: ^8.57.0 with TypeScript plugin
- **Vitest**: ^2.0.0 for testing
- **GitHub Actions**: CI/CD for testing and publishing

---

## Getting Started

### Prerequisites
- Node.js (version compatible with ES2020)
- npm or yarn
- API keys for at least one AI provider (OpenAI, Anthropic, or Gemini)

### Installation

#### For Users
```bash
npm install -g sourcesailor
```

#### For Development
```bash
# Clone the repository
git clone https://github.com/PrashamTrivedi/SourceSailor-CLI.git
cd SourceSailor-CLI

# Install dependencies
npm install

# Build the project
npm run build

# Link locally for testing
npm link
```

### Initial Setup
```bash
# Configure API keys and default model
SourceSailor setup \
  --apiKey <your_openai_api_key> \
  --model gpt-3.5-turbo \
  --anthropicApiKey <your_anthropic_api_key> \
  --geminiApiKey <your_gemini_api_key> \
  --analysisDir p  # Use 'p' to save analysis in project directory
```

Configuration is stored in `~/.SourceSailor/config.json`

### Quick Test
```bash
# Test on a sample project
SourceSailor analyse . --verbose
```

---

## Architecture & Code Structure

### Project Layout
```
SourceSailor-CLI/
├── index.mts                    # Main entry point, CLI setup
├── commands/                    # Command implementations
│   ├── setup.mts               # API key configuration
│   ├── analyse.mts             # Main analysis logic
│   ├── getDirStructure.mts    # Directory structure extraction
│   ├── prepareReport.mts       # Report generation
│   ├── listModels.mts          # List available AI models
│   ├── listConfig.mts          # Show current configuration
│   ├── updateConfig.mts        # Update configuration
│   └── setExpertise.mts        # Set user expertise levels
├── AI Provider Implementations
│   ├── llmInterface.mts        # Interface definition for all AI providers
│   ├── openai.mts              # OpenAI implementation
│   ├── gemini.mts              # Google Gemini implementation
│   ├── anthropic.mts           # Anthropic Claude implementation
│   └── modelUtils.mts          # Model management & provider routing
├── Core Utilities
│   ├── directoryProcessor.mts  # File tree traversal with gitignore
│   ├── utils.mts               # Config/file operations
│   ├── prompts.mts             # AI prompt templates
│   └── terminalRenderrer.mts   # Terminal markdown rendering
├── _tests_/                    # Test files (*.test.mts)
└── Configuration Files
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    └── .eslintrc.json
```

### Architectural Patterns

#### 1. Command Pattern (Yargs)
Each command is a module with:
- `command`: Command name and parameters
- `describe`: Command description
- `builder`: Argument configuration
- `handler`: Execution logic

Example from `commands/setup.mts:8`:
```typescript
export const command = 'setup [apiKey|k] [model|m]'
export const describe = 'Setup OpenAI API Key and default model'
export function builder(yargs: Argv) { /* ... */ }
export function handler(argv: Arguments) { /* ... */ }
```

#### 2. Strategy Pattern (AI Providers)
The `LlmInterface` (llmInterface.mts:2-10) defines a common interface:
```typescript
interface LlmInterface {
    getName(): string
    listModels(verbose: boolean): Promise<string[]>
    inferProjectDirectory(...): Promise<string | undefined>
    inferDependency(...): Promise<string | undefined | AsyncIterable<string>>
    inferCode(...): Promise<string | undefined | AsyncIterable<string>>
    inferInterestingCode(...): Promise<string | undefined | AsyncIterable<string>>
    generateReadme(...): Promise<string | undefined | AsyncIterable<string>>
}
```

All providers (OpenAI, Gemini, Anthropic) implement this interface.

#### 3. Singleton Pattern (ModelUtils)
`ModelUtils` (modelUtils.mts:7-74) is a singleton that:
- Caches model instances
- Routes requests to appropriate providers
- Manages model availability

```typescript
const modelUtils = ModelUtils.getInstance()
await modelUtils.initializeModels()
const llmInterface = modelUtils.getLlmInterface(modelName)
```

#### 4. Configuration Management
- Global config stored in `~/.SourceSailor/config.json`
- Analysis outputs in project-specific directories
- Supports both home directory and project-relative storage

---

## User Journey

### Primary User Flow: Analyzing a Codebase

1. **Setup** (First Time Only)
   ```bash
   SourceSailor setup --apiKey <key> --model <model>
   ```
   - User provides API credentials
   - System validates and stores in `~/.SourceSailor/config.json`
   - Default model is configured

2. **Optional: Set Expertise Level**
   ```bash
   SourceSailor setExpertise
   ```
   - Interactive prompts for programming language expertise
   - Tailors analysis depth based on user's skill level
   - Stored in config for future analyses

3. **Get Directory Structure** (Optional)
   ```bash
   SourceSailor dirStructure <path> --withContent
   ```
   - Quick preview of project structure
   - Can include file contents
   - Respects gitignore patterns

4. **Analyze Codebase** (Main Operation)
   ```bash
   SourceSailor analyse <path> --model <model> --streaming
   ```
   **What happens:**
   - a. System reads directory structure (directoryProcessor.mts:14-134)
   - b. AI infers project type, language, framework (commands/analyse.mts:200-241)
   - c. Identifies dependency file and analyzes it (commands/analyse.mts:328-367)
   - d. Analyzes code structure and patterns (commands/analyse.mts:295-323)
   - e. Identifies interesting code (commands/analyse.mts:261-292)
   - f. Writes analysis to `.SourceSailor/analysis/` directory

   **For Monorepos:**
   - Detects multiple codebases (commands/analyse.mts:144-189)
   - Analyzes each subdirectory separately
   - Generates individual reports per codebase

5. **Generate Report**
   ```bash
   SourceSailor prepareReport <path> --streaming
   ```
   - Consolidates all analysis data
   - Generates comprehensive README-style documentation
   - Can stream output in real-time

6. **List Available Models** (Optional)
   ```bash
   SourceSailor listModels
   ```
   - Shows all available models across providers
   - Helps in selecting appropriate model for analysis

### Alternative Flows

#### Update Configuration
```bash
SourceSailor updateConfig --model gpt-4 --analysisDir /custom/path
```

#### Check Current Config
```bash
SourceSailor listConfig
```

---

## System Flow

### High-Level Flow Diagram

```
User Command
    ↓
index.mts (Yargs Router)
    ↓
Command Handler (commands/*.mts)
    ↓
ModelUtils.getInstance() → Get LlmInterface
    ↓
Directory Analysis (if needed)
    ↓
AI Provider (OpenAI/Gemini/Anthropic)
    ↓
Response Processing
    ↓
Write Analysis/Report
    ↓
Terminal Output (with ora/chalk/cli-markdown)
```

### Detailed Analysis Flow

#### Step 1: Directory Structure Extraction
**File**: `directoryProcessor.mts`

```
getDirStructure()
    ↓
Read .gitignore patterns
    ↓
Recursively traverse directories
    ↓
Filter files based on:
    - Gitignore patterns
    - Custom ignore list
    - node_modules
    - Binary files (.jpg, .png, etc.)
    ↓
Return FileNode tree with content
```

**Key Logic** (directoryProcessor.mts:60-122):
- Respects nested `.gitignore` files
- Skips binary files (extensionsToSkipContent)
- Supports wildcard patterns

#### Step 2: Project Inference
**File**: `commands/analyse.mts:200-241`

```
analyseDirectoryStructure()
    ↓
Get directory structure with content
    ↓
Create structure without content (for AI)
    ↓
Call llm.inferProjectDirectory()
    ↓
AI returns JSON with:
    - isMonorepo: boolean
    - programmingLanguage: string
    - framework: string
    - dependenciesFile: string
    - lockFile: string
    - entryPointFile: string
    - workflow: string
    - directories: string[] (if monorepo)
    ↓
Write to .SourceSailor/analysis/directoryInferrence.json
```

**Prompt Used** (prompts.mts:41-100):
- Uses function calling for structured output
- Distinguishes monorepo vs single codebase
- Identifies dependency files (package.json, go.mod, etc.)

#### Step 3: Dependency Analysis
**File**: `commands/analyse.mts:328-367`

```
inferDependenciesAndWriteAnalysis()
    ↓
Read dependency file (e.g., package.json)
    ↓
Call llm.inferDependency(dependencyFile, workflow)
    ↓
AI analyzes:
    - Frameworks used
    - Purpose of each dependency
    - Validates/modifies workflow
    ↓
Stream or batch write response
    ↓
Write to .SourceSailor/analysis/dependencyInferrence.md
```

#### Step 4: Code Analysis
**File**: `commands/analyse.mts:295-323`

```
analyzeCodebase()
    ↓
Remove lockfiles from structure
    ↓
Call llm.inferCode(directoryStructure)
    ↓
AI analyzes:
    - What the codebase does
    - Role of each file
    - Code patterns
    ↓
Write to .SourceSailor/analysis/codeInferrence.md
```

#### Step 5: Interesting Code Detection
**File**: `commands/analyse.mts:261-292`

```
analyseInterestingCode()
    ↓
Call llm.inferInterestingCode(directoryStructure)
    ↓
AI identifies:
    - Unique implementations
    - Non-standard CRUD patterns
    - Novel problem-solving
    ↓
Appends to codeInferrence.md
```

**Expertise Integration**: Prompts adapt explanation depth based on user's expertise level set in config.

#### Step 6: Report Generation
**File**: `commands/prepareReport.mts:46-124`

```
prepareReport handler()
    ↓
Read all analysis files from .SourceSailor/analysis/
    ↓
Consolidate:
    - directoryStructure.json
    - dependencyInference.md
    - codeInferrence.md
    ↓
Call llm.generateReadme()
    ↓
AI generates:
    - About section
    - Installation & Usage
    - About the Code
    ↓
Write to .SourceSailor/analysis/inferredReadme.md
```

---

## Key Components Deep Dive

### 1. Directory Processor (`directoryProcessor.mts`)

**Purpose**: Traverse filesystem and build a tree structure with file contents.

**Key Features**:
- Gitignore pattern matching using `ignore` library
- Recursive directory traversal
- Binary file detection and exclusion
- Nested gitignore support

**Data Structure**:
```typescript
interface FileNode {
    name: string
    content: string | undefined | null  // null for binary files
    children?: FileNode[]              // present for directories
}
```

**Important Function**: `getDirStructure(dirPath, otherIgnorePaths, verbose)`
- Reads `.gitignore` from project root
- Merges with custom ignore patterns
- Returns complete tree with file contents

**Gotcha**: The function uses `customIgnores()` to check patterns, which handles wildcards differently than the `ignore` library itself.

---

### 2. Model Utils (`modelUtils.mts`)

**Purpose**: Centralized model management and provider routing.

**Singleton Pattern**:
```typescript
const modelUtils = ModelUtils.getInstance()
```

**Initialization Flow**:
```typescript
await modelUtils.initializeModels()
// This calls:
// 1. new OpenAIInferrence()
// 2. new GeminiInference()
// 3. new AnthropicInterface()
// 4. Fetches available models from each
// 5. Caches models in Map<string, LlmInterface>
```

**Model Selection**:
```typescript
const llm = modelUtils.getLlmInterface(modelName)
// Looks up model in cache
// Returns appropriate provider instance
// Throws if model not found
```

**Why This Matters**: You can seamlessly switch between providers without changing command logic. Just specify a different model name.

---

### 3. LLM Interface (`llmInterface.mts`)

**Purpose**: Common interface for all AI providers.

**Key Methods**:
- `inferProjectDirectory()`: Analyzes directory structure, returns structured JSON
- `inferDependency()`: Analyzes dependency files
- `inferCode()`: Analyzes code structure and purpose
- `inferInterestingCode()`: Finds unique patterns
- `generateReadme()`: Consolidates analysis into documentation

**Streaming Support**: Methods return either `string` or `AsyncIterable<string>`:
```typescript
if (allowStreaming) {
    for await (const chunk of response) {
        process.stdout.write(chunk)
    }
}
```

---

### 4. AI Provider Implementations

#### OpenAI (`openai.mts`)

**Key Features**:
- Function calling for structured outputs
- Model limits tracking (modelLimits array)
- Temperature: 0 (deterministic)
- Timeout: 60 seconds

**Prompt Construction** (openai.mts:43-60):
```typescript
createPrompt(systemPrompt, userPrompt, isVerbose, userExpertise)
// Injects user expertise into system prompt
// Returns ChatCompletionMessageParam[]
```

**Tool Usage** (openai.mts:76-81):
- For `inferProjectDirectory()`, uses function calling
- Ensures structured JSON response
- Tool choice forced to specified function

#### Similar Patterns in Gemini & Anthropic
- Both follow same interface
- Gemini uses Google's Generative AI SDK
- Anthropic uses Claude API
- All support streaming

---

### 5. Prompts (`prompts.mts`)

**Purpose**: Centralized AI prompt templates.

**Structure**:
```typescript
export const prompts: Record<string, Prompt> = {
    commonSystemPrompt: { ... },      // Base system instructions
    rootUnderstanding: { ... },       // Project structure analysis
    dependencyUnderstanding: { ... }, // Dependency analysis
    codeUnderstanding: { ... },       // Code analysis
    interestingCodeParts: { ... },    // Interesting code detection
    readmePrompt: { ... }             // README generation
}
```

**Function Calling Schema** (prompts.mts:52-100):
For structured outputs, prompts include a `params` field:
```typescript
params: {
    name: "inferLanguageAndFramework",
    description: "Gets following parameters...",
    parameters: {
        type: "object",
        properties: { ... },
        required: [ ... ]
    }
}
```

**Expertise Integration**:
The `commonSystemPrompt` instructs AI to adapt based on user expertise:
```
"The developer who is using this report has set their expertise in <Expertise> tag,
Adapt the depth and complexity of your explanations based on the developer's expertise."
```

---

### 6. Utilities (`utils.mts`)

**Configuration Management**:
- `readConfig()`: Reads from `~/.SourceSailor/config.json`
- `writeConfig()`: Writes configuration

**Analysis Management**:
- `writeAnalysis(projectRoot, analysisName, content, isJson, isProjectRoot)`
  - Writes to `.SourceSailor/analysis/` directory
  - Supports JSON and Markdown formats
- `getAnalysis(projectRoot, isProjectRoot)`
  - Reads all analysis files
  - Returns consolidated object

**Gitignore Integration**:
- `addAnalysisInGitIgnore(projectRoot)`
  - Adds `.SourceSailor/analysis` to `.gitignore`
  - Prevents committing AI-generated analysis

**Security**:
- `maskSensitiveInfo(input)`: Masks API keys, passwords, secrets in output

---

### 7. Terminal Rendering (`terminalRenderrer.mts`)

**Purpose**: Render markdown in terminal with colors and formatting.

**Dependencies**:
- `cli-markdown`: Converts markdown to terminal-friendly format
- `chalk`: Colors and styling
- `ora`: Spinners for loading states

**Usage Pattern**:
```typescript
const spinner = ora('Analyzing...').start()
// ... do work ...
const markdown = markdownToTerminal(response)
spinner.stopAndPersist({ symbol: '✔️', text: markdown })
```

---

## Coding Standards & Conventions

### File Extensions
- **`.mts`**: TypeScript with ES Modules
  - Required because `"type": "module"` in package.json
  - Import statements use `.mjs` extension: `import {foo} from './bar.mjs'`

### Import Conventions
```typescript
// Always use .mjs in imports (even though files are .mts)
import {readConfig} from './utils.mjs'  // ✓ Correct
import {readConfig} from './utils.mts'  // ✗ Wrong
```

### Module Exports
Commands use named exports:
```typescript
export const command = '...'
export const describe = '...'
export function builder(yargs: Argv) { ... }
export function handler(argv: Arguments) { ... }
```

### TypeScript Configuration
- **Target**: ES2020
- **Module**: node16
- **Strict Mode**: Enabled
- **Output**: `./dist` directory

### ESLint Rules
- Uses `@typescript-eslint` recommended rules
- No custom overrides (rules: {} is empty)
- Extensions: `.mts` files only

### Error Handling
1. **Try-Catch with Spinners**:
   ```typescript
   const spinner = ora('Processing...').start()
   try {
       // ... work ...
       spinner.stopAndPersist({ symbol: '✔️', text: 'Done!' })
   } catch (error) {
       spinner.stopAndPersist({ symbol: '❌', text: 'Error!' })
       console.error(error)
   }
   ```

2. **Verbose Logging**:
   ```typescript
   if (isVerbose) {
       console.log({ data, structure, info })
   }
   ```

3. **Error Files**:
   - Errors written to `.SourceSailor/errors/` directory
   - `writeError(projectRoot, errorType, errorContent, errorMessage)`

### Naming Conventions
- **Functions**: camelCase (`inferDependency`, `analyzeCode`)
- **Files**: camelCase with `.mts` extension
- **Interfaces**: PascalCase (`LlmInterface`, `FileNode`)
- **Constants**: camelCase for prompts, UPPER_CASE for config keys

### Configuration Keys
```typescript
{
    OPENAI_API_KEY: string
    DEFAULT_OPENAI_MODEL: string
    ANTHROPIC_API_KEY?: string
    GEMINI_API_KEY?: string
    ANALYSIS_DIR: string  // 'p' means project-relative
    userExpertise?: object
}
```

---

## Testing

### Test Framework: Vitest

**Configuration**: `vitest.config.ts`
- Provider: Istanbul
- Coverage: JSON, HTML, text-summary
- Includes: `**/*.{test,spec}.mts`
- Excludes: node_modules, dist, .d.ts files

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# CI mode (with multiple reporters)
npm run test:ci
```

### Test Structure
Location: `_tests_/` directory

**Naming**: `<module>.test.mts`

**Pattern**:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies
vi.mock('fs')
vi.mock('path')

describe('functionName', () => {
    beforeEach(() => {
        // Setup
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it('should do something', () => {
        // Arrange
        // Act
        // Assert
        expect(result).toEqual(expected)
    })
})
```

### Mocking Conventions
From `_tests_/utils.test.mts:29-65`:
```typescript
function setupMockFileSystem() {
    const mockFs = {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        // ... etc
    }
    // Setup mock behavior
    vi.spyOn(fs, 'existsSync').mockImplementation(mockFs.existsSync)
    // ... etc
}
```

### Coverage Goals
- `**/*.mts` files included
- Aim for comprehensive coverage
- Reports in `./coverage/` directory

---

## Building & Deployment

### Build Process
```bash
npm run build
```

**What Happens**:
1. `rm -rf dist` - Clean previous build
2. `tsc` - TypeScript compilation to `./dist`
3. `chmod +x dist/index.mjs` - Make executable

**Output**: All `.mts` → `.mjs` in `dist/` directory

### Local Development
```bash
# Build and link locally
npm run link

# Now 'SourceSailor' command is available globally
SourceSailor --help
```

### Publishing to NPM
**Automated via GitHub Actions**: `.github/workflows/publish.yaml`

**Trigger**: Push to `main` branch (likely with version tag)

**Manual Publish**:
```bash
npm version patch  # or minor, major
npm publish
```

**Package Name**: `sourcesailor` (lowercase)

### CI/CD Pipeline

#### Test & Report (`.github/workflows/testAndReport.yml`)
- Runs on: Push to any branch
- Steps:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run `npm run test:ci`
  5. Generate coverage reports
  6. Upload to GitHub

#### Issues Workflow (`.github/workflows/issues.yml`)
- Automates issue management
- Labels and triage

---

## Contributing

### Setup Development Environment
1. Fork repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create feature branch: `git checkout -b feature/my-feature`
5. Make changes
6. Run tests: `npm test`
7. Run linter: `npm run lint:fix`
8. Build: `npm run build`
9. Test locally: `npm run link`

### Making Changes

#### Adding a New Command
1. Create `commands/myCommand.mts`
2. Implement required exports:
   ```typescript
   export const command = 'myCommand <arg>'
   export const describe = 'Description'
   export function builder(yargs: Argv) { ... }
   export function handler(argv: Arguments) { ... }
   ```
3. Register in `index.mts`:
   ```typescript
   import * as MyCommand from './commands/myCommand.mjs'
   yargsSetup.command(MyCommand)
   ```
4. Add tests in `_tests_/myCommand.test.mts`

#### Adding a New AI Provider
1. Create provider file (e.g., `myProvider.mts`)
2. Implement `LlmInterface`:
   ```typescript
   export class MyProviderInference implements LlmInterface {
       getName() { return 'MyProvider' }
       // ... implement all methods
   }
   ```
3. Register in `modelUtils.mts:22-46`:
   ```typescript
   const myProvider = new MyProviderInference()
   const myProviderModels = await myProvider.listModels(false)
   this.modelList.push(...myProviderModels)
   // ... map models to provider
   ```

#### Modifying Prompts
1. Edit `prompts.mts`
2. Test with multiple model providers
3. Consider user expertise levels
4. For structured outputs, update function calling schemas

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new features
4. Follow existing code style
5. Write clear commit messages
6. Submit PR against `main` branch

### Commit Message Style
See recent commits:
```bash
git log --oneline -10
```

Pattern: `<action>: <description>`
Examples:
- "feat: Add support for new AI provider"
- "fix: Handle missing dependency file gracefully"
- "docs: Update onboarding guide"
- "test: Add coverage for edge cases"

---

## Gotchas & Tricky Parts

### 1. Module Resolution (.mts vs .mjs)
**Problem**: Files are `.mts` but imports use `.mjs`

**Why**: TypeScript compiles `.mts` → `.mjs` at build time. Import paths must reference the compiled output.

**Solution**: Always use `.mjs` in import statements:
```typescript
import {foo} from './bar.mjs'  // ✓
```

---

### 2. Streaming vs Non-Streaming
**Problem**: Methods return different types based on `allowStreaming` parameter.

**Type**: `Promise<string | undefined | AsyncIterable<string>>`

**Handling**:
```typescript
const result = await llm.inferCode(code, allowStreaming, ...)
if (allowStreaming) {
    for await (const chunk of result as AsyncIterable<string>) {
        process.stdout.write(chunk)
    }
} else {
    const text = result as string
    console.log(text)
}
```

---

### 3. Analysis Directory Paths
**Problem**: Analysis can be stored in two different locations.

**Locations**:
- `~/.SourceSailor/<projectName>/analysis/` (default)
- `<projectDir>/.SourceSailor/analysis/` (when `analysisDir: 'p'`)

**Controlled By**: `config.ANALYSIS_DIR`
- Default: `os.homedir()`
- Project-relative: `'p'`

**Why**: Some users want analysis with code, others separate.

---

### 4. Monorepo vs Single Codebase Detection
**Logic** (prompts.mts:44):
> "A repository is not a monorepo if there is a dependency file at the root of the codebase, even if there is a folder which contains its own dependency file."

**Tricky Case**:
```
project/
├── package.json        # Root dependency file
└── packages/
    ├── app/
    │   └── package.json
    └── lib/
        └── package.json
```

**Classification**: **NOT a monorepo** (has root package.json)

**Why**: This prevents false positives for projects with examples/ or tests/ subdirectories.

---

### 5. Gitignore Pattern Matching
**Problem**: The `ignore` library and custom pattern matching can behave differently.

**Custom Handling** (directoryProcessor.mts:41-58):
- Wildcard patterns (`*`, `?`) use custom regex
- Directory patterns (`foo/`) checked specially
- `node_modules` always ignored (hardcoded)

**Watch Out**: Adding patterns to ignore list may not work as expected. Test with `--verbose` flag.

---

### 6. Error Handling in Monorepos
**Behavior**: If one directory fails in a monorepo, analysis continues for others.

**Code** (commands/analyse.mts:179-186):
```typescript
catch (error) {
    writeError(analysisRootDir, 'ReadingDir', error.stack, errorMessage)
    console.error(errorAnalysisSkipped)
    if (isVerbose) { console.error(error) }
    // Continues to next directory
}
```

**Why**: One bad subdirectory shouldn't block entire analysis.

---

### 7. User Expertise Integration
**Where It's Used**: Injected into every AI prompt

**Format**:
```typescript
const userExpertise = JSON.stringify(config.userExpertise)
// Added to prompt: <Expertise>{...}</Expertise>
```

**Impact**: AI adapts explanation depth automatically. Test your changes with different expertise levels!

---

### 8. Token Limits and Model Selection
**Problem**: Different models have different token limits.

**Tracking** (openai.mts:27-40):
```typescript
private modelLimits: ModelLimit[] = [
    { name: 'gpt-4', limit: 8000 },
    { name: 'gpt-4o', limit: 128000 },
    // ...
]
```

**Not Enforced**: Currently just documented. Future enhancement could validate before API calls.

---

### 9. Binary File Handling
**Excluded Extensions** (directoryProcessor.mts:6):
```typescript
const extentionsToSkipContent = [
    '.jpg', '.jpeg', '.png', '.gif', '.ico',
    '.mp4', '.svg', '.pdf', '.doc', '.db',
    '.sqlite', '.docx', '.xls', '.xlsx'
]
```

**Why**: Sending binary content to AI providers is wasteful and can cause errors.

**Representation**: `content: null` in FileNode

---

### 10. Config Initialization Edge Case
**Problem**: `setup` command reads config before writing (setup.mts:55-61).

**Risk**: If config is corrupted JSON, it fails silently and overwrites.

**Workaround**: Uses try-catch, defaults to empty object `{}` on error.

---

### 11. Ora Spinner and Streaming
**Problem**: Spinners interfere with streaming output.

**Solution** (commands/analyse.mts:269):
```typescript
if (allowStreaming) {
    spinner.stop().clear()  // Clear spinner before streaming
    for await (const chunk of result) {
        process.stdout.write(chunk)
    }
}
```

**Always**: Stop/clear spinners before streaming.

---

### 12. Lockfile Removal Logic
**Why**: Lockfiles are huge and not useful for AI analysis.

**Implementation** (commands/analyse.mts:382-392):
```typescript
function removeLockFile(file: FileNode | undefined, lockfile: string) {
    if (file?.children) {
        for (const child of file.children) {
            if (child.name === lockfile) {
                file.children = file.children.filter(c => c.name !== lockfile)
            } else {
                removeLockFile(child, lockfile)  // Recursive
            }
        }
    }
}
```

**Recursive**: Removes lockfiles from all nested directories.

---

## Additional Resources

### API Documentation
- **OpenAI**: https://platform.openai.com/docs
- **Anthropic**: https://docs.anthropic.com/
- **Google Gemini**: https://ai.google.dev/docs

### Related Libraries
- **Yargs**: https://yargs.js.org/
- **Inquirer**: https://github.com/SBoudrias/Inquirer.js
- **Vitest**: https://vitest.dev/

### Project Links
- **GitHub**: https://github.com/PrashamTrivedi/SourceSailor-CLI
- **NPM**: https://www.npmjs.com/package/sourcesailor
- **Issues**: https://github.com/PrashamTrivedi/SourceSailor-CLI/issues

---

## Questions & Support

### Common Questions

**Q: Which AI provider should I use?**
A:
- GPT-4o: Best for large codebases (128k token limit)
- GPT-3.5-turbo: Fastest and cheapest for small projects
- Claude (Anthropic): Good for detailed analysis
- Gemini: Google's offering, good for cost

**Q: Can I analyze private repositories?**
A: Yes! The tool runs locally. Your code is only sent to the AI provider you configure.

**Q: How do I add a custom AI provider?**
A: Implement the `LlmInterface` and register in `modelUtils.mts`. See "Adding a New AI Provider" section.

**Q: Why is my analysis taking so long?**
A: Large codebases require multiple AI API calls. Use `--streaming` to see progress in real-time.

**Q: Can I customize the AI prompts?**
A: Yes! Edit `prompts.mts`. Consider making prompts configurable via CLI in future.

### Getting Help
- **Issues**: https://github.com/PrashamTrivedi/SourceSailor-CLI/issues
- **Discussions**: GitHub Discussions
- **Email**: contact@prashamhtrivedi.in

---

## Conclusion

You're now equipped to contribute to SourceSailor CLI! Key takeaways:

1. **Architecture**: Command pattern + Strategy pattern for AI providers
2. **Flow**: Directory → Inference → Dependency → Code → Report
3. **Extensibility**: Easy to add new commands and AI providers
4. **Testing**: Vitest with comprehensive mocking
5. **Gotchas**: .mts/.mjs distinction, streaming vs non-streaming, analysis paths

**Next Steps**:
1. Run `npm run link` and test the CLI on a sample project
2. Read through one command implementation end-to-end
3. Run tests and check coverage
4. Pick a small enhancement and contribute!

Happy coding! 🚀

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Maintained By**: SourceSailor Contributors
