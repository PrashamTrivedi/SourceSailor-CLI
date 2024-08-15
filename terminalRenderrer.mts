
import cliMd from 'cli-markdown'



export function markdownToTerminal(markdown: string): string {
    // const html = marked(markdown) as string
    return cliMd(markdown)
}