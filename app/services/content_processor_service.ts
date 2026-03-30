import { inject } from '@adonisjs/core'
import MarkdownIt from 'markdown-it'
import { htmlToText } from 'html-to-text'
import hljs from 'highlight.js'
import { tasklist } from '@mdit/plugin-tasklist'
import { container } from '@mdit/plugin-container'
import { alert } from '@mdit/plugin-alert'
import { fullEmoji } from '@mdit/plugin-emoji'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import OEmbedService from '#services/oembed_service'

export interface ProcessedContent {
  contentHtml: string | null
  contentPlain: string | null
}

interface EntryLike {
  contentHtml: string | null
  contentPlain: string | null
}

@inject()
export default class ContentProcessorService {
  private md: MarkdownIt
  private oembedService: OEmbedService

  constructor(oembedService?: OEmbedService) {
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
      .use(tasklist)
      .use(alert)
      .use(fullEmoji)
      .use(sub)
      .use(sup)
      .use(container, { name: 'info' })
      .use(container, { name: 'tip' })
      .use(container, { name: 'warning' })
      .use(container, { name: 'danger' })
    this.oembedService = oembedService ?? new OEmbedService()
  }

  /**
   * Post-process rendered HTML to replace standalone URL paragraphs with oEmbed embeds.
   * Standalone URLs in markdown become <p>URL</p> after rendering, which we detect
   * and replace with embed HTML where the provider supports oEmbed.
   */
  private async processOEmbedUrls(html: string): Promise<string> {
    const urlParagraphRegex = /<p>(https?:\/\/[^\s<]+)<\/p>/g
    const matches = [...html.matchAll(urlParagraphRegex)]

    if (matches.length === 0) {
      return html
    }

    // De-duplicate URLs before fetching
    const uniqueUrls = [...new Set(matches.map((m) => m[1]))]
    let result = html

    for (const url of uniqueUrls) {
      const embedHtml = await this.oembedService.convertUrlToEmbed(url)
      if (embedHtml) {
        result = result.replaceAll(`<p>${url}</p>`, embedHtml)
      }
    }

    return result
  }

  /**
   * Process markdown content to HTML and plain text
   */
  async processMarkdown(markdownContent: string | null): Promise<ProcessedContent> {
    if (!markdownContent) {
      return {
        contentHtml: null,
        contentPlain: null,
      }
    }

    // Render markdown to HTML first
    const renderedHtml = this.md.render(markdownContent)

    // Then replace standalone URL paragraphs with oEmbed embeds
    const contentHtml = await this.processOEmbedUrls(renderedHtml)

    // Convert to plain text for search/preview
    const contentPlain = htmlToText(contentHtml, {
      wordwrap: false,
      selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'iframe', format: 'skip' },
        { selector: '.oembed-embed', format: 'skip' },
      ],
    })

    return {
      contentHtml,
      contentPlain,
    }
  }

  /**
   * Update content fields on an entry
   */
  async updateEntryContent(entry: EntryLike, markdownContent: string | null): Promise<void> {
    const processed = await this.processMarkdown(markdownContent)
    entry.contentHtml = processed.contentHtml
    entry.contentPlain = processed.contentPlain
  }
}
