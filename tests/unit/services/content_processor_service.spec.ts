import { test } from '@japa/runner'
import ContentProcessorService from '#services/content_processor_service'

test.group('ContentProcessorService', () => {
  test('should process markdown to HTML and plain text', ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = '# Hello World\n\nThis is **bold** text.'

    const result = service.processMarkdown(markdown)

    assert.isString(result.contentHtml)
    assert.isString(result.contentPlain)
    assert.include(result.contentHtml!, '<h1>Hello World</h1>')
    assert.include(result.contentHtml!, '<strong>bold</strong>')
    assert.include(result.contentPlain!.toLowerCase(), 'hello world')
    assert.include(result.contentPlain!, 'bold')
  })

  test('should return null for empty markdown', ({ assert }) => {
    const service = new ContentProcessorService()

    const result = service.processMarkdown(null)

    assert.isNull(result.contentHtml)
    assert.isNull(result.contentPlain)
  })

  test('should return null for empty string markdown', ({ assert }) => {
    const service = new ContentProcessorService()

    const result = service.processMarkdown('')

    assert.isNull(result.contentHtml)
    assert.isNull(result.contentPlain)
  })

  test('should update entry content fields', ({ assert }) => {
    const service = new ContentProcessorService()
    const entry = {
      contentHtml: null as string | null,
      contentPlain: null as string | null,
    }
    const markdown = '## Test Content'

    service.updateEntryContent(entry, markdown)

    assert.isString(entry.contentHtml)
    assert.isString(entry.contentPlain)
    assert.include(entry.contentHtml!, '<h2>Test Content</h2>')
    assert.include((entry.contentPlain as string).toLowerCase(), 'test content')
  })

  test('should handle complex markdown with links and images', ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = `
# Title

This is a [link](https://example.com) and an image:

![Alt text](image.jpg)

- List item 1
- List item 2
    `

    const result = service.processMarkdown(markdown)

    assert.include(result.contentHtml!, '<a href="https://example.com">link</a>')
    assert.include(result.contentHtml!, '<ul>')
    assert.include(result.contentHtml!, '<li>List item 1</li>')
    // Images should be skipped in plain text
    assert.notInclude(result.contentPlain!, 'Alt text')
    assert.include(result.contentPlain!, 'link')
  })

  test('should handle code blocks with unknown language', ({ assert }) => {
    const service = new ContentProcessorService()
    const markdown = '```unknown-lang\nconst x = 1;\n```'

    const result = service.processMarkdown(markdown)

    assert.include(result.contentHtml!, 'class="hljs"')
    assert.include(result.contentHtml!, 'const x = 1;')
  })
})
