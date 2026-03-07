import { test } from '@japa/runner'
import OEmbedService from '#services/oembed_service'

test.group('OEmbedService', () => {
  test('should sanitize oEmbed HTML and remove unsafe tags', ({ assert }) => {
    const service = new OEmbedService()
    const unsafeHtml = '<iframe src="https://example.com"></iframe><script>alert("xss")</script>'

    const sanitized = service.sanitizeOEmbedHtml(unsafeHtml)

    assert.include(sanitized, '<iframe')
    assert.notInclude(sanitized, '<script>')
    assert.notInclude(sanitized, 'alert')
  })

  test('should preserve safe iframe attributes', ({ assert }) => {
    const service = new OEmbedService()
    const html =
      '<iframe src="https://youtube.com/embed/123" width="560" height="315" frameborder="0" allowfullscreen></iframe>'

    const sanitized = service.sanitizeOEmbedHtml(html)

    assert.include(sanitized, 'src="https://youtube.com/embed/123"')
    assert.include(sanitized, 'width="560"')
    assert.include(sanitized, 'height="315"')
  })

  test('should preserve blockquote tags for Twitter embeds', ({ assert }) => {
    const service = new OEmbedService()
    const html = '<blockquote class="twitter-tweet"><p>Test tweet</p></blockquote>'

    const sanitized = service.sanitizeOEmbedHtml(html)

    assert.include(sanitized, '<blockquote')
    assert.include(sanitized, 'Test tweet')
  })

  test('should handle empty HTML input', ({ assert }) => {
    const service = new OEmbedService()
    const html = ''

    const sanitized = service.sanitizeOEmbedHtml(html)

    assert.equal(sanitized, '')
  })

  test('should remove potentially harmful attributes', ({ assert }) => {
    const service = new OEmbedService()
    const html = '<iframe src="https://example.com" onload="alert(1)" onerror="alert(2)"></iframe>'

    const sanitized = service.sanitizeOEmbedHtml(html)

    assert.include(sanitized, '<iframe')
    assert.notInclude(sanitized, 'onload')
    assert.notInclude(sanitized, 'onerror')
  })

  test('should preserve data attributes', ({ assert }) => {
    const service = new OEmbedService()
    const html = '<div data-video-id="123" data-provider="youtube">Content</div>'

    const sanitized = service.sanitizeOEmbedHtml(html)

    assert.include(sanitized, 'data-video-id="123"')
    assert.include(sanitized, 'data-provider="youtube"')
  })

  test('should not support lookalike domains', async ({ assert }) => {
    const service = new OEmbedService()

    // These should NOT be treated as supported providers
    const maliciousUrls = [
      'https://youtube.com.evil.com/watch?v=abc',
      'https://notyoutube.com/watch?v=abc',
      'https://fakevimeo.com/123',
    ]

    for (const url of maliciousUrls) {
      const result = await service.extractOEmbed(url)
      assert.isNull(result, `Expected null for lookalike domain: ${url}`)
    }
  })

  test('should recognise all supported provider domains', ({ assert }) => {
    const service = new OEmbedService()
    const isSupportedUrl = (service as any).isSupportedUrl.bind(service)

    const supportedUrls = [
      // Video & Screen Recording
      'https://www.youtube.com/watch?v=abc',
      'https://youtu.be/abc',
      'https://vimeo.com/123456',
      'https://www.loom.com/share/abc123',
      'https://streamable.com/abc',
      'https://www.ted.com/talks/abc',
      // Social
      'https://twitter.com/user/status/123',
      'https://x.com/user/status/123',
      'https://bsky.app/profile/user.bsky.social/post/abc',
      'https://www.instagram.com/p/abc',
      'https://www.tiktok.com/@user/video/123',
      'https://www.reddit.com/r/programming/comments/abc',
      // Audio
      'https://soundcloud.com/artist/track',
      'https://open.spotify.com/track/abc',
      // Code & Playgrounds
      'https://codepen.io/user/pen/abc',
      'https://codesandbox.io/s/new',
      'https://replit.com/@user/project',
      'https://repl.it/@user/project',
      'https://runkit.com/user/notebook',
      'https://observablehq.com/@user/notebook',
      'https://wokwi.com/share/abc',
      'https://marimo.app/l/abc',
      // Design & Diagrams
      'https://www.figma.com/file/abc/my-design',
      'https://miro.com/app/board/abc',
      'https://whimsical.com/my-diagram-abc',
      'https://overflow.io/s/abc',
      // Presentations & Slides
      'https://www.slideshare.net/user/presentation',
      'https://speakerdeck.com/user/talk',
      // Images & Media
      'https://www.flickr.com/photos/user/123',
    ]

    for (const url of supportedUrls) {
      assert.isTrue(isSupportedUrl(url), `Expected ${url} to be supported`)
    }
  })

  test('should not support unrecognised domains', ({ assert }) => {
    const service = new OEmbedService()
    const isSupportedUrl = (service as any).isSupportedUrl.bind(service)

    const unsupportedUrls = [
      'https://example.com/video/123',
      'https://github.com/user/repo',
      'https://notion.so/page-abc',
      'not-a-url',
    ]

    for (const url of unsupportedUrls) {
      assert.isFalse(isSupportedUrl(url), `Expected ${url} to be unsupported`)
    }
  })
})
