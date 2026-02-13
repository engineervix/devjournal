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
    const response = await client.post('/api/v1/entries').bearerToken('invalid-token-12345').json({
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
    const entry = await Entry.query().where('user_id', user.id).preload('tags').firstOrFail()
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

    const response = await client.post('/api/v1/entries').withGuard('api').loginAs(user).json({
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

    const response = await client.post('/api/v1/entries').withGuard('api').loginAs(user).json({
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

  test('list entries', async ({ client }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    // Create some entries
    await Entry.createMany([
      { userId: user.id, entryType: 'daily', title: 'Entry 1', contentMarkdown: 'Content 1' },
      { userId: user.id, entryType: 'til', title: 'Entry 2', contentMarkdown: 'Content 2' },
      { userId: user.id, entryType: 'snippet', title: 'Entry 3', contentMarkdown: 'Content 3' },
    ])

    const response = await client
      .get('/api/v1/entries')
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        meta: { total: 3, perPage: 10, currentPage: 1 },
        data: [
            { title: 'Entry 3' },
            { title: 'Entry 2' },
            { title: 'Entry 1' },
        ]
      },
    })
  })

  test('update entry', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const entry = await Entry.create({ 
        userId: user.id, 
        entryType: 'daily', 
        title: 'Original Title', 
        contentMarkdown: 'Original Content' 
    })

    const response = await client
      .put(`/api/v1/entries/${entry.id}`)
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'daily',
        title: 'Updated Title',
        contentMarkdown: 'Updated Content',
      })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Entry updated successfully.',
      data: {
        id: entry.id,
        title: 'Updated Title',
        contentMarkdown: 'Updated Content',
      },
    })

    await entry.refresh()
    assert.equal(entry.title, 'Updated Title')
    assert.equal(entry.contentMarkdown, 'Updated Content')
  })

  test('cannot update entry of another user', async ({ client }) => {
    const user = await User.create({
        fullName: 'Test User',
        email: 'test1@example.com',
        password: 'password',
    })

    const otherUser = await User.create({
        fullName: 'Other User',
        email: 'test2@example.com',
        password: 'password',
    })

    const entry = await Entry.create({ 
        userId: otherUser.id, 
        entryType: 'daily', 
        title: 'Other User Entry', 
        contentMarkdown: 'Content' 
    })

    const response = await client
      .put(`/api/v1/entries/${entry.id}`)
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'daily',
        title: 'Hacked Title',
      })

    response.assertStatus(403)
  })

  test('cannot update non-existent entry', async ({ client }) => {
    const user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password',
    })

    // Use a random UUID
    const response = await client
      .put('/api/v1/entries/00000000-0000-0000-0000-000000000000')
      .withGuard('api')
      .loginAs(user)
      .json({
        entryType: 'daily',
        title: 'Updated Title',
      })

    response.assertStatus(404)
  })

  test('show entry', async ({ client }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const entry = await Entry.create({
        userId: user.id,
        entryType: 'daily',
        title: 'Show Test',
        contentMarkdown: 'Show Content',
    })

    const response = await client
      .get(`/api/v1/entries/${entry.id}`)
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        id: entry.id,
        title: 'Show Test',
        contentMarkdown: 'Show Content',
      },
    })
  })

  test('cannot show entry of another user', async ({ client }) => {
    const user = await User.create({
        fullName: 'Test User',
        email: 'test1@example.com',
        password: 'password',
    })

    const otherUser = await User.create({
        fullName: 'Other User',
        email: 'test2@example.com',
        password: 'password',
    })

    const entry = await Entry.create({
        userId: otherUser.id,
        entryType: 'daily',
        title: 'Other User Entry',
        contentMarkdown: 'Content'
    })

    const response = await client
      .get(`/api/v1/entries/${entry.id}`)
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('cannot show non-existent entry', async ({ client }) => {
    const user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password',
    })

    const response = await client
      .get('/api/v1/entries/00000000-0000-0000-0000-000000000000')
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(404)
  })
})
