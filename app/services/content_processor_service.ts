import { inject } from '@adonisjs/core'
import MarkdownIt from 'markdown-it'
import { htmlToText } from 'html-to-text'

export interface ProcessedContent {
  contentHtml: string | null
  contentPlain: string | null
}

@inject()
export default class ContentProcessorService {
  private md: MarkdownIt

  constructor() {
    this.md = new MarkdownIt()
  }

  /**
   * Process markdown content to HTML and plain text
   */
  processMarkdown(markdownContent: string | null): ProcessedContent {
    if (!markdownContent) {
      return {
        contentHtml: null,
        contentPlain: null,
      }
    }

    const contentHtml = this.md.render(markdownContent)
    const contentPlain = htmlToText(contentHtml, {
      wordwrap: false,
      selectors: [{ selector: 'img', format: 'skip' }],
    })

    return {
      contentHtml,
      contentPlain,
    }
  }

  /**
   * Update content fields on an entry
   */
  updateEntryContent(entry: any, markdownContent: string | null): void {
    const processed = this.processMarkdown(markdownContent)
    entry.contentHtml = processed.contentHtml
    entry.contentPlain = processed.contentPlain
  }
}
