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
    const html = '<iframe src="https://youtube.com/embed/123" width="560" height="315" frameborder="0" allowfullscreen></iframe>'

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
})
