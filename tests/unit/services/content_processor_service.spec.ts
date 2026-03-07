import { test } from '@japa/runner'
import ContentProcessorService from '#services/content_processor_service'
import OEmbedService from '#services/oembed_service'

test.group('ContentProcessorService', () => {
  test('should process markdown to HTML and plain text', async ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = '# Hello World\n\nThis is **bold** text.'

    const result = await service.processMarkdown(markdown)

    assert.isString(result.contentHtml)
    assert.isString(result.contentPlain)
    assert.include(result.contentHtml!, '<h1>Hello World</h1>')
    assert.include(result.contentHtml!, '<strong>bold</strong>')
    assert.include(result.contentPlain!.toLowerCase(), 'hello world')
    assert.include(result.contentPlain!, 'bold')
  })

  test('should return null for empty markdown', async ({ assert }) => {
    const service = new ContentProcessorService()

    const result = await service.processMarkdown(null)

    assert.isNull(result.contentHtml)
    assert.isNull(result.contentPlain)
  })

  test('should return null for empty string markdown', async ({ assert }) => {
    const service = new ContentProcessorService()

    const result = await service.processMarkdown('')

    assert.isNull(result.contentHtml)
    assert.isNull(result.contentPlain)
  })

  test('should update entry content fields', async ({ assert }) => {
    const service = new ContentProcessorService()
    const entry = {
      contentHtml: null as string | null,
      contentPlain: null as string | null,
    }
    const markdown = '## Test Content'

    await service.updateEntryContent(entry, markdown)

    assert.isString(entry.contentHtml)
    assert.isString(entry.contentPlain)
    assert.include(entry.contentHtml!, '<h2>Test Content</h2>')
    assert.include((entry.contentPlain as string).toLowerCase(), 'test content')
  })

  test('should handle complex markdown with links and images', async ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = `
# Title

This is a [link](https://example.com) and an image:

![Alt text](image.jpg)

- List item 1
- List item 2
    `

    const result = await service.processMarkdown(markdown)

    assert.include(result.contentHtml!, '<a href="https://example.com">link</a>')
    assert.include(result.contentHtml!, '<ul>')
    assert.include(result.contentHtml!, '<li>List item 1</li>')
    // Images should be skipped in plain text
    assert.notInclude(result.contentPlain!, 'Alt text')
    assert.include(result.contentPlain!, 'link')
  })

  test('should handle code blocks with unknown language', async ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = '```unknown-lang\nconst x = 1;\n```'

    const result = await service.processMarkdown(markdown)

    assert.include(result.contentHtml!, 'class="hljs"')
    assert.include(result.contentHtml!, 'const x = 1;')
  })

  test('should embed a standalone URL as an oembed-embed container', async ({ assert }) => {
    const mockOEmbedService = {
      convertUrlToEmbed: async (_url: string) =>
        '<div class="oembed-embed"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></div>',
    }
    const service = new ContentProcessorService(mockOEmbedService as OEmbedService)
    const markdown = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

    const result = await service.processMarkdown(markdown)

    assert.include(result.contentHtml!, 'oembed-embed')
    assert.include(result.contentHtml!, '<iframe')
    // Embed containers should not appear in plain text
    assert.notInclude(result.contentPlain!, 'oembed-embed')
    assert.notInclude(result.contentPlain!, '<iframe')
  })

  test('should not process inline URLs', async ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = 'Check out this video https://www.youtube.com/watch?v=dQw4w9WgXcQ on YouTube'

    const result = await service.processMarkdown(markdown)

    // Inline URLs should not be converted to embeds
    assert.notInclude(result.contentHtml!, 'oembed-embed')
    assert.include(result.contentHtml!, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  test('should not process URLs in markdown links', async ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = '[Watch this video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)'

    const result = await service.processMarkdown(markdown)

    // URLs in markdown links should not be converted to embeds
    assert.notInclude(result.contentHtml!, 'oembed-embed')
    assert.include(result.contentHtml!, '<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">')
  })

  test('should handle markdown with multiple paragraphs', async ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = `
First paragraph with text.

Second paragraph with more text.

Third paragraph.
    `

    const result = await service.processMarkdown(markdown)

    assert.include(result.contentHtml!, '<p>First paragraph with text.</p>')
    assert.include(result.contentHtml!, '<p>Second paragraph with more text.</p>')
    assert.include(result.contentHtml!, '<p>Third paragraph.</p>')
  })
})
