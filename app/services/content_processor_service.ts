import { inject } from '@adonisjs/core'
import MarkdownIt from 'markdown-it'
import { htmlToText } from 'html-to-text'
import hljs from 'highlight.js'

export interface ProcessedContent {
  contentHtml: string | null
  contentPlain: string | null
}

@inject()
export default class ContentProcessorService {
  private md: MarkdownIt

  constructor() {
    this.md = new MarkdownIt({
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return (
              '<pre class="hljs"><code>' +
              hljs.highlight(str, { language: lang }).value +
              '</code></pre>'
            )
          } catch (__) {}
        }

        return (
          '<pre class="hljs"><code>' +
          str.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
          '</code></pre>'
        )
      },
    })
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
