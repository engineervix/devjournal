import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Entry from '#models/entry'
import Tag from '#models/tag'

test.group('Api entries coverage', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('list entries with all filters', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const entry1 = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'A Daily',
      contentMarkdown: 'Content',
    })
    await Entry.create({
      userId: user.id,
      entryType: 'til',
      title: 'A TIL',
      contentMarkdown: 'Content',
    })

    // Tag entry1
    const tag = await Tag.create({ name: 'test', slug: 'test', usageCount: 1 })
    await entry1.related('tags').attach([tag.id])

    const response = await client
      .get('/api/v1/entries')
      .qs({
        type: 'daily',
        period: 'today',
        sort: 'newest',
        tag: 'test',
        page: 1,
        perPage: 5,
      })
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        data: [{ id: entry1.id }],
      },
    })

    assert.lengthOf(response.body().data.data, 1)
    assert.equal(response.body().data.data[0].id, entry1.id)
  })

  test('create entry with minimal payload', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const response = await client
      .post('/api/v1/entries')
      .json({
        entryType: 'daily',
        // No title, content, or tags
      })
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(201)

    const entry = await Entry.query().where('user_id', user.id).firstOrFail()
    assert.isNull(entry.contentMarkdown)
    // Title should be auto-generated
    assert.include(entry.title!, 'Daily Log')
  })

  test('create entry with full payload', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const response = await client
      .post('/api/v1/entries')
      .json({
        entryType: 'snippet',
        title: 'My Snippet',
        contentMarkdown: 'alert("hello")',
        tags: ['js', 'alert'],
      })
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(201)

    const entry = await Entry.query().where('user_id', user.id).preload('tags').firstOrFail()
    assert.equal(entry.title, 'My Snippet')
    assert.equal(entry.contentMarkdown, 'alert("hello")')
    assert.lengthOf(entry.tags, 2)
  })

  test('update entry partial - only title', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const entry = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Old',
      contentMarkdown: 'Content',
    })

    const response = await client
      .put(`/api/v1/entries/${entry.id}`)
      .json({
        entryType: 'daily',
        title: 'New Title',
        // contentMarkdown omitted
      })
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(200)
    await entry.refresh()
    assert.equal(entry.title, 'New Title')
    // Should content be null or preserved?
    // In `updateEntry` service method:
    // entry.contentMarkdown = data.contentMarkdown || null
    // If it's undefined in payload, validator returns optional().
    // Content should be preserved because we are doing a partial update
    assert.equal(entry.contentMarkdown, 'Content')
  })

  test('update entry - clear tags', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const entry = await Entry.create({ userId: user.id, entryType: 'daily', title: 'Old' })
    const tag = await Tag.create({ name: 'test', slug: 'test' })
    await entry.related('tags').attach([tag.id])

    const response = await client
      .put(`/api/v1/entries/${entry.id}`)
      .json({
        entryType: 'daily',
        title: 'Old',
        tags: [], // Empty array
      })
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(200)
    await entry.load('tags')
    assert.lengthOf(entry.tags, 0)
  })

  test('update entry partial - no title change', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const entry = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Original',
      contentMarkdown: 'Content',
    })

    const response = await client
      .put(`/api/v1/entries/${entry.id}`)
      .json({
        entryType: 'daily',
        contentMarkdown: 'New Content',
        // title omitted
      })
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(200)
    await entry.refresh()
    assert.equal(entry.title, 'Original')
    assert.equal(entry.contentMarkdown, 'New Content')
  })
})
