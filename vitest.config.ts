// vitest.config.ts
import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        root: '.', // Set this to your project root
        coverage: {
            provider: 'istanbul',
            reporter: ['json', 'json-summary', 'text-summary', 'html'],
            // reportsDirectory: './coverage',

            include: ['**/*.mts', '**/openai.mts', '**/utils.mts', '**/*.mjs'], // Adjust this to match your source files
            exclude: ['node_modules', '_test_/', '**/*.d.ts', 'dist/'],
            all: true,
        },
        include: ['**/*.{test,spec}.mts'],
        reporters: process.env.GITHUB_ACTIONS ? ['json', 'html', 'github-actions'] : ['default', 'json', 'html'],
        outputFile: {
            json: './coverage/test-summary.json',
            html: './coverage/report.html'
        }
    },
})