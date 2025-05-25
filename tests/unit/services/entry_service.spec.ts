import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import EntryService from '#services/entry_service'
import Entry from '#models/entry'
import Tag from '#models/tag'
import User from '#models/user'

test.group('Entry Service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should get entries with default filters and pagination', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    // Create test entries
    await Entry.createMany([
      {
        userId: user.id,
        entryType: 'daily',
        title: 'Daily Entry 1',
        contentMarkdown: 'Content 1',
      },
      {
        userId: user.id,
        entryType: 'til',
        title: 'TIL Entry 1',
        contentMarkdown: 'Content 2',
      },
    ])

    const entryService = new EntryService()
    const result = await entryService.getEntries()

    assert.equal(result.length, 2)
    assert.equal(result.currentPage, 1)
    assert.equal(result.perPage, 10)
  })

  test('should filter entries by type', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    await Entry.createMany([
      {
        userId: user.id,
        entryType: 'daily',
        title: 'Daily Entry',
        contentMarkdown: 'Content',
      },
      {
        userId: user.id,
        entryType: 'til',
        title: 'TIL Entry',
        contentMarkdown: 'Content',
      },
    ])

    const entryService = new EntryService()
    const result = await entryService.getEntries({ type: 'daily' })

    assert.equal(result.length, 1)
    assert.equal(result[0].entryType, 'daily')
  })

  test('should filter entries by period - today', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    // Create an entry from yesterday
    const yesterday = DateTime.now().minus({ days: 1 })

    await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Yesterday Entry',
      contentMarkdown: 'Content',
      createdAt: yesterday,
    })

    // Create an entry from today
    await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Today Entry',
      contentMarkdown: 'Content',
    })

    const entryService = new EntryService()
    const result = await entryService.getEntries({ period: 'today' })

    assert.equal(result.length, 1)
    assert.equal(result[0].title, 'Today Entry')
  })

  test('should sort entries by oldest first', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const yesterday = DateTime.now().minus({ days: 1 })

    await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Older Entry',
      contentMarkdown: 'Content',
      createdAt: yesterday,
    })

    await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Newer Entry',
      contentMarkdown: 'Content',
    })

    const entryService = new EntryService()
    const result = await entryService.getEntries({ sort: 'oldest' })

    assert.equal(result.length, 2)
    assert.equal(result[0].title, 'Older Entry')
    assert.equal(result[1].title, 'Newer Entry')
  })

  test('should search entries with full-text search', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    await Entry.createMany([
      {
        userId: user.id,
        entryType: 'daily',
        title: 'JavaScript Tutorial',
        contentMarkdown: 'Learning JavaScript fundamentals',
        contentPlain: 'Learning JavaScript fundamentals',
      },
      {
        userId: user.id,
        entryType: 'til',
        title: 'Python Tips',
        contentMarkdown: 'Python best practices',
        contentPlain: 'Python best practices',
      },
    ])

    const entryService = new EntryService()
    const result = await entryService.searchEntries('JavaScript')

    assert.equal(result.length, 1)
    assert.equal(result[0].title, 'JavaScript Tutorial')
  })

  test('should return all entries when search query is empty', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    await Entry.createMany([
      {
        userId: user.id,
        entryType: 'daily',
        title: 'Entry 1',
        contentMarkdown: 'Content 1',
      },
      {
        userId: user.id,
        entryType: 'til',
        title: 'Entry 2',
        contentMarkdown: 'Content 2',
      },
    ])

    const entryService = new EntryService()
    const result = await entryService.searchEntries('')

    assert.equal(result.length, 2)
  })

  test('should get entries by tag', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const tag = await Tag.create({
      name: 'javascript',
      slug: 'javascript',
      usageCount: 1,
    })

    const entry = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'JS Entry',
      contentMarkdown: 'Content',
    })

    await entry.related('tags').attach([tag.id])

    const entryService = new EntryService()
    const result = await entryService.getEntriesByTag('javascript')

    assert.equal(result.entries.length, 1)
    assert.equal(result.tag.name, 'javascript')
    assert.equal(result.entries[0].title, 'JS Entry')
  })

  test('should get entries for export with filters', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    await Entry.createMany([
      {
        userId: user.id,
        entryType: 'daily',
        title: 'Daily Entry',
        contentMarkdown: 'Content',
      },
      {
        userId: user.id,
        entryType: 'til',
        title: 'TIL Entry',
        contentMarkdown: 'Content',
      },
    ])

    const entryService = new EntryService()
    const result = await entryService.getEntriesForExport(user.id, { type: 'daily' })

    assert.equal(result.length, 1)
    assert.equal(result[0].entryType, 'daily')
  })

  test('should create entry with default title', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const entryService = new EntryService()
    const entry = await entryService.createEntry(user.id, {
      entryType: 'daily',
      contentMarkdown: 'Test content',
    })

    assert.isNotNull(entry.title)
    assert.include(entry.title!, 'Daily Log')
    assert.equal(entry.entryType, 'daily')
    assert.equal(entry.contentMarkdown, 'Test content')
  })

  test('should create entry with custom title', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const entryService = new EntryService()
    const entry = await entryService.createEntry(user.id, {
      entryType: 'til',
      title: 'Custom Title',
      contentMarkdown: 'Test content',
    })

    assert.equal(entry.title, 'Custom Title')
    assert.equal(entry.entryType, 'til')
  })

  test('should create entry with tags', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const entryService = new EntryService()
    const entry = await entryService.createEntry(user.id, {
      entryType: 'snippet',
      title: 'Code Snippet',
      contentMarkdown: 'console.log("hello")',
      tags: ['javascript', 'coding'],
    })

    await entry.load('tags')
    assert.equal(entry.tags.length, 2)

    const tagNames = entry.tags.map((tag) => tag.name).sort()
    assert.deepEqual(tagNames, ['coding', 'javascript'])
  })

  test('should update entry', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const entry = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Original Title',
      contentMarkdown: 'Original content',
    })

    const entryService = new EntryService()
    const updatedEntry = await entryService.updateEntry(entry.id, {
      entryType: 'til',
      title: 'Updated Title',
      contentMarkdown: 'Updated content',
      tags: ['updated'],
    })

    assert.equal(updatedEntry.title, 'Updated Title')
    assert.equal(updatedEntry.entryType, 'til')
    assert.equal(updatedEntry.contentMarkdown, 'Updated content')

    await updatedEntry.load('tags')
    assert.equal(updatedEntry.tags.length, 1)
    assert.equal(updatedEntry.tags[0].name, 'updated')
  })

  test('should delete entry and update tag usage counts', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const tag = await Tag.create({
      name: 'test-tag',
      slug: 'test-tag',
      usageCount: 2,
    })

    const entry = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Test Entry',
      contentMarkdown: 'Content',
    })

    await entry.related('tags').attach([tag.id])

    const entryService = new EntryService()
    await entryService.deleteEntry(entry.id)

    // Check that entry is deleted
    const deletedEntry = await Entry.find(entry.id)
    assert.isNull(deletedEntry)

    // Check that tag usage count is decremented
    await tag.refresh()
    assert.equal(tag.usageCount, 1)
  })

  test('should generate default title for different entry types', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const entryService = new EntryService()

    const dailyEntry = await entryService.createEntry(user.id, {
      entryType: 'daily',
      contentMarkdown: 'Content',
    })

    const tilEntry = await entryService.createEntry(user.id, {
      entryType: 'til',
      contentMarkdown: 'Content',
    })

    const snippetEntry = await entryService.createEntry(user.id, {
      entryType: 'snippet',
      contentMarkdown: 'Content',
    })

    assert.include(dailyEntry.title!, 'Daily Log')
    assert.include(tilEntry.title!, 'TIL')
    assert.include(snippetEntry.title!, 'Code Snippet')
  })

  test('should handle entry with no tags during update', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const entry = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Test Entry',
      contentMarkdown: 'Content',
    })

    const entryService = new EntryService()
    const updatedEntry = await entryService.updateEntry(entry.id, {
      entryType: 'daily',
      title: 'Updated Title',
      contentMarkdown: 'Updated content',
      tags: [],
    })

    await updatedEntry.load('tags')
    assert.equal(updatedEntry.tags.length, 0)
  })
})
