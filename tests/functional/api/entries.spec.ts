import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Entry from '#models/entry'
import Tag from '#models/tag'

test.group('Api entries', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('create entry via api', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const response = await client
      .post('/api/v1/entries')
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'daily',
        contentMarkdown: 'This is a test note from API',
        tags: ['api', 'test'],
      })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        entryType: 'daily',
        contentMarkdown: 'This is a test note from API',
      },
    })

    // Verify entry was created in database
    const entries = await Entry.query().where('user_id', user.id)
    assert.lengthOf(entries, 1)
    assert.equal(entries[0].entryType, 'daily')
    assert.equal(entries[0].contentMarkdown, 'This is a test note from API')

    // Verify tags were created
    const tags = await Tag.query().whereIn('name', ['api', 'test'])
    assert.lengthOf(tags, 2)
    assert.includeMembers(
      tags.map((t) => t.name),
      ['api', 'test']
    )
  })

  test('cannot create entry without token', async ({ client }) => {
    const response = await client.post('/api/v1/entries').json({
      entryType: 'daily',
      contentMarkdown: 'This is a test note from API',
    })

    response.assertStatus(401)
    response.assertBodyContains({
      success: false,
      message: 'Authentication required.',
    })
  })

  test('cannot create entry with invalid token', async ({ client }) => {
    const response = await client
      .post('/api/v1/entries')
      .bearerToken('invalid-token-12345')
      .json({
        entryType: 'daily',
        contentMarkdown: 'This is a test note from API',
      })

    response.assertStatus(401)
  })

  test('creates tags if they do not exist', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    // Verify tags don't exist yet
    const existingTags = await Tag.query().whereIn('name', ['newtag1', 'newtag2'])
    assert.lengthOf(existingTags, 0)

    const response = await client
      .post('/api/v1/entries')
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'til',
        contentMarkdown: 'Learning about tag creation',
        tags: ['newtag1', 'newtag2'],
      })

    response.assertStatus(201)

    // Verify tags were created
    const createdTags = await Tag.query().whereIn('name', ['newtag1', 'newtag2'])
    assert.lengthOf(createdTags, 2)
    assert.includeMembers(
      createdTags.map((t) => t.name),
      ['newtag1', 'newtag2']
    )

    // Verify tags are associated with the entry
    const entry = await Entry.query()
      .where('user_id', user.id)
      .preload('tags')
      .firstOrFail()
    assert.lengthOf(entry.tags, 2)
  })

  test('reuses existing tags', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    // Create a tag first
    const existingTag = await Tag.create({ name: 'existing', slug: 'existing' })

    const response = await client
      .post('/api/v1/entries')
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'snippet',
        contentMarkdown: 'Code snippet',
        tags: ['existing', 'newone'],
      })

    response.assertStatus(201)

    // Verify only one new tag was created
    const allTags = await Tag.all()
    assert.lengthOf(allTags, 2)

    // Verify the existing tag wasn't duplicated
    const existingTags = await Tag.query().where('name', 'existing')
    assert.lengthOf(existingTags, 1)
    assert.equal(existingTags[0].id, existingTag.id)
  })


  test('creates entry with auto-generated title', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const response = await client
      .post('/api/v1/entries')
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'daily',
        contentMarkdown: 'Entry without explicit title',
      })

    response.assertStatus(201)

    // Verify entry has auto-generated title
    const entry = await Entry.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(entry.title)
    assert.match(entry.title!!, /Daily Log - \d{4}-\d{2}-\d{2}/)
  })

  test('processes markdown to HTML', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const response = await client
      .post('/api/v1/entries')
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'daily',
        contentMarkdown: '# Heading\n\nThis is **bold** text.',
      })

    response.assertStatus(201)

    // Verify HTML was generated
    const entry = await Entry.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(entry.contentHtml)
    assert.include(entry.contentHtml, '<h1>')
    assert.include(entry.contentHtml, '<strong>')
  })
})
