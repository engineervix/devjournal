import { inject } from '@adonisjs/core'
import MarkdownIt from 'markdown-it'
import { htmlToText } from 'html-to-text'
import hljs from 'highlight.js'
import OEmbedService from '#services/oembed_service'

export interface ProcessedContent {
  contentHtml: string | null
  contentPlain: string | null
}

@inject()
export default class ContentProcessorService {
  private md: MarkdownIt
  private oembedService: OEmbedService

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
    this.oembedService = new OEmbedService()
  }

  /**
   * Detect standalone URLs in markdown that should be converted to oEmbed
   * Returns URLs that appear on their own line
   */
  private extractStandaloneUrls(markdownContent: string): string[] {
    const urlRegex = /^(https?:\/\/[^\s]+)$/gm
    const matches = markdownContent.match(urlRegex)
    return matches || []
  }

  /**
   * Process oEmbed URLs in markdown content
   * Replaces standalone URLs with oEmbed embeds where available
   */
  private async processOEmbedUrls(markdownContent: string): Promise<string> {
    const urls = this.extractStandaloneUrls(markdownContent)

    if (urls.length === 0) {
      return markdownContent
    }

    let processedContent = markdownContent

    // Process each URL and replace with oEmbed HTML if available
    for (const url of urls) {
      const embedHtml = await this.oembedService.convertUrlToEmbed(url)
      if (embedHtml) {
        // Replace the standalone URL with a marker that won't be processed by markdown
        // We'll use HTML comment markers that markdown-it will preserve
        processedContent = processedContent.replace(url, `<!-- oembed:${url} -->\n${embedHtml}\n<!-- /oembed -->`)
      }
    }

    return processedContent
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

    // First, process any oEmbed URLs
    const processedMarkdown = await this.processOEmbedUrls(markdownContent)

    // Then render markdown to HTML
    const contentHtml = this.md.render(processedMarkdown)

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
  async updateEntryContent(entry: any, markdownContent: string | null): Promise<void> {
    const processed = await this.processMarkdown(markdownContent)
    entry.contentHtml = processed.contentHtml
    entry.contentPlain = processed.contentPlain
  }
}
