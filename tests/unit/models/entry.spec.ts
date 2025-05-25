import { test } from '@japa/runner'
import Entry from '#models/entry'
import User from '#models/user'
import Tag from '#models/tag'
import { createUser, truncateTables } from '#tests/helpers/database'
import db from '@adonisjs/lucid/services/db'
import { EntryType } from '#models/entry' // Assuming EntryType is an enum or similar

test.group('Models / Entry', (group) => {
  let user: User

  group.setup(async () => {
    // Setup a user once for all tests in this group
    await truncateTables() // Clear all relevant tables initially
    user = await createUser({ email: 'entrytestuser@example.com', password: 'password' })
  })

  group.each.setup(async () => {
    // Truncate entries and related pivot tables before each test
    // User and Tags table are not truncated in each.setup to preserve the main user and any tags created for relationship tests
    await db.rawQuery('TRUNCATE entries, entry_tags RESTART IDENTITY CASCADE')
  })

  test('Entry Creation: creates a new entry with minimal required fields', async ({ assert }) => {
    const entryData = {
      userId: user.id,
      entryType: EntryType.Thought, // Assuming 'thought' is a valid entry type
    }
    const entry = await Entry.create(entryData)

    assert.instanceOf(entry, Entry)
    assert.equal(entry.userId, user.id)
    assert.equal(entry.entryType, EntryType.Thought)
    assert.isNotNull(entry.createdAt)
    assert.isNotNull(entry.updatedAt)

    const entryInDb = await Entry.find(entry.id)
    assert.isNotNull(entryInDb)
    assert.equal(entryInDb!.userId, user.id)
  })

  test('Entry Creation: creates an entry with all fields', async ({ assert }) => {
    const entryData = {
      userId: user.id,
      entryType: EntryType.Journal, // Assuming 'journal' is a valid entry type
      title: 'My Test Journal Entry',
      contentMarkdown: 'This is **markdown** content.',
      contentHtml: '<p>This is <strong>markdown</strong> content.</p>',
      contentPlain: 'This is markdown content.',
      metadata: { customField: 'customValue' },
    }
    const entry = await Entry.create(entryData)

    assert.instanceOf(entry, Entry)
    assert.equal(entry.title, entryData.title)
    assert.equal(entry.contentMarkdown, entryData.contentMarkdown)
    assert.equal(entry.contentHtml, entryData.contentHtml)
    assert.equal(entry.contentPlain, entryData.contentPlain)
    assert.deepEqual(entry.metadata, entryData.metadata)
    assert.isNotNull(entry.createdAt)
    assert.isNotNull(entry.updatedAt)
  })

  test('Relationship with User (belongsTo): loads associated user', async ({ assert }) => {
    const entry = await Entry.create({ userId: user.id, entryType: EntryType.Note })

    await entry.load('user')

    assert.instanceOf(entry.user, User)
    assert.equal(entry.user.id, user.id)
    assert.equal(entry.user.email, user.email)
  })

  test('Relationship with User (belongsTo): query with preload user', async ({ assert }) => {
    await Entry.create({ userId: user.id, entryType: EntryType.Note })
    const fetchedEntry = await Entry.query().preload('user').first()

    assert.isNotNull(fetchedEntry)
    assert.instanceOf(fetchedEntry!.user, User)
    assert.equal(fetchedEntry!.user.id, user.id)
  })

  test('Relationship with Tags (manyToMany): attach and load tags', async ({ assert }) => {
    // Need to clear tags table here if tags are created per test, or ensure unique tags
    await db.rawQuery('TRUNCATE tags RESTART IDENTITY CASCADE')
    const tag1 = await Tag.create({ name: 'Tag Alpha' })
    const tag2 = await Tag.create({ name: 'Tag Beta' })

    const entry = await Entry.create({ userId: user.id, entryType: EntryType.Bookmark })
    await entry.related('tags').attach([tag1.id, tag2.id])

    await entry.load('tags')

    assert.isArray(entry.tags)
    assert.lengthOf(entry.tags, 2)
    assert.isTrue(entry.tags.some((t) => t.id === tag1.id))
    assert.isTrue(entry.tags.some((t) => t.id === tag2.id))

    const entryWithTags = await Entry.query().preload('tags').where('id', entry.id).first()
    assert.isNotNull(entryWithTags)
    assert.lengthOf(entryWithTags!.tags, 2)
  })

  test('Relationship with Tags (manyToMany): detach tags', async ({ assert }) => {
    await db.rawQuery('TRUNCATE tags RESTART IDENTITY CASCADE')
    const tag1 = await Tag.create({ name: 'Tag Gamma' })
    const tag2 = await Tag.create({ name: 'Tag Delta' })
    const entry = await Entry.create({ userId: user.id, entryType: EntryType.Thought })

    await entry.related('tags').attach([tag1.id, tag2.id])
    await entry.related('tags').detach([tag1.id])

    await entry.load('tags')
    assert.lengthOf(entry.tags, 1)
    assert.equal(entry.tags[0].id, tag2.id)
  })

  test('Relationship with Tags (manyToMany): sync tags', async ({ assert }) => {
    await db.rawQuery('TRUNCATE tags RESTART IDENTITY CASCADE')
    const tag1 = await Tag.create({ name: 'Tag Epsilon' })
    const tag2 = await Tag.create({ name: 'Tag Zeta' })
    const tag3 = await Tag.create({ name: 'Tag Eta' }) // New tag for sync
    const entry = await Entry.create({ userId: user.id, entryType: EntryType.Journal })

    await entry.related('tags').attach([tag1.id, tag2.id]) // Initial tags

    // Sync to remove tag1 and add tag3, keeping tag2
    await entry.related('tags').sync([tag2.id, tag3.id])

    await entry.load('tags')
    assert.lengthOf(entry.tags, 2)
    assert.isTrue(entry.tags.some((t) => t.id === tag2.id))
    assert.isTrue(entry.tags.some((t) => t.id === tag3.id))
    assert.isFalse(entry.tags.some((t) => t.id === tag1.id))
  })

  test('Timestamps: createdAt and updatedAt are auto-generated and updated', async ({ assert }) => {
    const entry = await Entry.create({ userId: user.id, entryType: EntryType.Thought })

    assert.isNotNull(entry.createdAt)
    assert.isNotNull(entry.updatedAt)

    const initialUpdatedAt = entry.updatedAt

    // Wait a bit to ensure updatedAt changes
    await new Promise((resolve) => setTimeout(resolve, 50))

    entry.title = 'Updated Title'
    await entry.save()

    assert.isTrue(entry.updatedAt > initialUpdatedAt)
  })
})
