import { extract } from '@extractus/oembed-extractor'
import { createDOMPurify } from 'dompurify'
import { JSDOM } from 'jsdom'

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
  private domPurify: ReturnType<typeof createDOMPurify>

  constructor() {
    // Initialize DOMPurify with JSDOM for Node.js environment
    const window = new JSDOM('').window
    this.domPurify = createDOMPurify(window as unknown as Window)
  }

  /**
   * Check if a URL is likely to support oEmbed
   * This is a simple heuristic check for common providers
   */
  private isSupportedUrl(url: string): boolean {
    const supportedDomains = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'twitter.com',
      'x.com',
      'soundcloud.com',
      'spotify.com',
      'codepen.io',
      'slideshare.net',
      'speakerdeck.com',
      'flickr.com',
      'instagram.com',
      'tiktok.com',
      'reddit.com',
    ]

    try {
      const urlObj = new URL(url)
      return supportedDomains.some((domain) => urlObj.hostname.includes(domain))
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
      const data = await extract(url, {}, { timeout: 5000 })
      return data as OEmbedData
    } catch (error) {
      // If oEmbed extraction fails, just return null and let the original URL remain
      console.error(`Failed to extract oEmbed data from ${url}:`, error)
      return null
    }
  }

  /**
   * Sanitize oEmbed HTML to prevent XSS attacks
   */
  sanitizeOEmbedHtml(html: string): string {
    return this.domPurify.sanitize(html, {
      ALLOWED_TAGS: ['iframe', 'blockquote', 'script', 'a', 'p', 'div', 'span', 'img'],
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
