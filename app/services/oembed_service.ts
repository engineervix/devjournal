import { extract } from '@extractus/oembed-extractor'
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import logger from '@adonisjs/core/services/logger'

export interface OEmbedData {
  html?: string
  title?: string
  author_name?: string
  author_url?: string
  provider_name?: string
  provider_url?: string
  thumbnail_url?: string
  width?: number
  height?: number
  type?: 'video' | 'photo' | 'link' | 'rich'
}

export default class OEmbedService {
  private domPurify: ReturnType<typeof DOMPurify>

  constructor() {
    // Initialize DOMPurify with JSDOM for Node.js environment
    const { window } = new JSDOM('')
    this.domPurify = DOMPurify(window as any)
  }

  /**
   * Check if a URL is likely to support oEmbed
   * This is a simple heuristic check for common providers
   */
  private isSupportedUrl(url: string): boolean {
    const supportedDomains = [
      // Video & Screen Recording
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'loom.com',
      'streamable.com',
      'ted.com',
      // Social
      'twitter.com',
      'x.com',
      'bsky.app',
      'instagram.com',
      'tiktok.com',
      'reddit.com',
      // Audio
      'soundcloud.com',
      'spotify.com',
      // Code & Playgrounds
      'codepen.io',
      'codesandbox.io',
      'replit.com',
      'repl.it',
      'runkit.com',
      'observablehq.com',
      'wokwi.com',
      'marimo.app',
      // Design & Diagrams
      'figma.com',
      'miro.com',
      'whimsical.com',
      'overflow.io',
      // Presentations & Slides
      'slideshare.net',
      'speakerdeck.com',
      // Images & Media
      'flickr.com',
    ]

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '')
      return supportedDomains.some((domain) => {
        const d = domain.toLowerCase()
        return hostname === d || hostname.endsWith('.' + d)
      })
    } catch {
      return false
    }
  }

  /**
   * Extract oEmbed data from a URL
   */
  async extractOEmbed(url: string): Promise<OEmbedData | null> {
    // Only attempt oEmbed extraction for supported URLs
    if (!this.isSupportedUrl(url)) {
      return null
    }

    try {
      const data = await extract(url, {}, { timeout: 5000 } as any)
      return data as OEmbedData
    } catch (error) {
      // If oEmbed extraction fails, just return null and let the original URL remain
      logger.error({ url, err: error }, 'Failed to extract oEmbed data')
      return null
    }
  }

  /**
   * Sanitize oEmbed HTML to prevent XSS attacks
   */
  sanitizeOEmbedHtml(html: string): string {
    return this.domPurify.sanitize(html, {
      ALLOWED_TAGS: ['iframe', 'blockquote', 'a', 'p', 'div', 'span', 'img'],
      ALLOWED_ATTR: [
        'src',
        'width',
        'height',
        'frameborder',
        'allow',
        'allowfullscreen',
        'title',
        'class',
        'href',
        'target',
        'rel',
        'data-*',
      ],
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ['target', 'rel'],
    })
  }

  /**
   * Convert oEmbed data to HTML embed code
   */
  async convertUrlToEmbed(url: string): Promise<string | null> {
    const oembedData = await this.extractOEmbed(url)

    if (!oembedData || !oembedData.html) {
      return null
    }

    // Sanitize the HTML before returning
    const sanitizedHtml = this.sanitizeOEmbedHtml(oembedData.html)

    // Wrap in a responsive container div
    return `<div class="oembed-embed">${sanitizedHtml}</div>`
  }
}
