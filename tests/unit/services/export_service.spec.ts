import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import ExportService from '#services/export_service'

test.group('ExportService', () => {
  test('should generate single markdown file content', ({ assert }) => {
    const service = new ExportService()
    const entries = [
      {
        id: 'entry-1',
        title: 'Test Entry',
        entryType: 'daily',
        contentMarkdown: '# Hello World',
        createdAt: DateTime.fromISO('2024-01-01T10:00:00Z'),
        tags: [{ name: 'tag1' }, { name: 'tag2' }],
      },
      {
        id: 'entry-2',
        title: null,
        entryType: 'til',
        contentMarkdown: null,
        createdAt: DateTime.fromISO('2024-01-02T15:30:00Z'),
        tags: [],
      },
    ] as any[]

    const result = service.generateSingleMarkdownFile(entries)

    assert.include(result, '# DevJournal Export')
    assert.include(result, 'Generated on:')
    assert.include(result, '## Test Entry')
    assert.include(result, '**Type:** daily')
    assert.include(result, '**Date:** 2024-01-01')
    assert.include(result, '**Tags:** tag1, tag2')
    assert.include(result, '# Hello World')
    assert.include(result, '## Untitled Entry')
    assert.include(result, '**Type:** til')
    assert.include(result, 'No content')
  })

  test('should generate individual markdown files', ({ assert }) => {
    const service = new ExportService()
    const entries = [
      {
        id: 'entry-123456789',
        title: 'Test Entry',
        entryType: 'daily',
        contentMarkdown: '# Content',
        createdAt: DateTime.fromISO('2024-01-01T10:00:00Z'),
        tags: [{ name: 'test' }],
      },
    ] as any[]

    const result = service.generateIndividualMarkdownFiles(entries)

    assert.lengthOf(result, 1)
    assert.equal(result[0].filename, '2024-01-01-daily-entry-12.md')
    assert.include(result[0].content, '---')
    assert.include(result[0].content, 'id: entry-123456789')
    assert.include(result[0].content, 'type: daily')
    assert.include(result[0].content, 'title: Test Entry')
    assert.include(result[0].content, 'date: 2024-01-01')
    assert.include(result[0].content, 'tags: [test]')
    assert.include(result[0].content, '# Content')
  })

  test('should handle entries without tags in individual files', ({ assert }) => {
    const service = new ExportService()
    const entries = [
      {
        id: 'entry-1',
        title: 'No Tags Entry',
        entryType: 'snippet',
        contentMarkdown: 'Some content',
        createdAt: DateTime.fromISO('2024-01-01T10:00:00Z'),
        tags: [],
      },
    ] as any[]

    const result = service.generateIndividualMarkdownFiles(entries)

    assert.lengthOf(result, 1)
    assert.notInclude(result[0].content, 'tags:')
    assert.include(result[0].content, 'title: No Tags Entry')
  })

  test('should handle null content in individual files', ({ assert }) => {
    const service = new ExportService()
    const entries = [
      {
        id: 'entry-1',
        title: 'Empty Entry',
        entryType: 'debug',
        contentMarkdown: null,
        createdAt: DateTime.fromISO('2024-01-01T10:00:00Z'),
        tags: [],
      },
    ] as any[]

    const result = service.generateIndividualMarkdownFiles(entries)

    assert.lengthOf(result, 1)
    assert.include(result[0].content, 'No content')
  })

  test('should have proper spacing between front matter and content', ({ assert }) => {
    const service = new ExportService()
    const entries = [
      {
        id: 'entry-1',
        title: 'Test Entry',
        entryType: 'daily',
        contentMarkdown: '# Test Content',
        createdAt: DateTime.fromISO('2024-01-01T10:00:00Z'),
        tags: [{ name: 'test' }],
      },
    ] as any[]

    const result = service.generateIndividualMarkdownFiles(entries)

    assert.lengthOf(result, 1)

    // Check that there's proper spacing between front matter and content
    const content = result[0].content
    assert.include(content, '---\n\n# Test Content')

    // Ensure the front matter ends with --- followed by empty line, then content
    const lines = content.split('\n')
    const frontMatterEndIndex = lines.lastIndexOf('---')
    assert.isTrue(frontMatterEndIndex > 0, 'Should find closing --- for front matter')
    assert.equal(lines[frontMatterEndIndex + 1], '', 'Should have empty line after front matter')
    assert.equal(
      lines[frontMatterEndIndex + 2],
      '# Test Content',
      'Content should start after empty line'
    )
  })

  test('should create zip archive', async ({ assert }) => {
    const service = new ExportService()
    const entries = [
      {
        id: 'entry-1',
        title: 'Test Entry',
        entryType: 'daily',
        contentMarkdown: '# Test',
        createdAt: DateTime.fromISO('2024-01-01T10:00:00Z'),
        tags: [],
      },
    ] as any[]

    const archive = await service.createZipArchive(entries)

    assert.isDefined(archive)
    assert.equal(typeof archive.append, 'function')
    assert.equal(typeof archive.finalize, 'function')
  })
})
