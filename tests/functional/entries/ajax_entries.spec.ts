import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Entry from '#models/entry'
import Tag from '#models/tag'

test.group('AJAX Entries Controller', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create new entry via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'daily',
        title: 'AJAX Test Entry',
        contentMarkdown: '# Test Content\n\nThis is a test entry created via AJAX.',
        tags: ['ajax', 'testing'],
      })

    response.assertStatus(200)

    const responseBody = response.body()
    assert.isTrue(responseBody.success)
    assert.equal(responseBody.message, 'Entry created successfully.')
    assert.exists(responseBody.entry)
    assert.equal(responseBody.entry.title, 'AJAX Test Entry')
    assert.equal(responseBody.entry.entryType, 'daily')
    assert.equal(
      responseBody.entry.contentMarkdown,
      '# Test Content\n\nThis is a test entry created via AJAX.'
    )
    assert.deepEqual(responseBody.entry.tags, ['ajax', 'testing'])

    // Verify entry was actually created in database
    const entry = await Entry.query().where('title', 'AJAX Test Entry').preload('tags').first()
    assert.isNotNull(entry)
    assert.equal(entry!.userId, user.id)
    assert.equal(entry!.entryType, 'daily')
    assert.equal(entry!.title, 'AJAX Test Entry')
    assert.equal(entry!.contentMarkdown, '# Test Content\n\nThis is a test entry created via AJAX.')
    assert.equal(entry!.tags.length, 2)
    assert.includeMembers(
      entry!.tags.map((tag) => tag.name),
      ['ajax', 'testing']
    )
  })

  test('should create entry without title via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .json({
        entryType: 'til',
        contentMarkdown: 'Today I learned about AJAX testing.',
        tags: ['til'],
      })

    response.assertStatus(200)

    const responseBody = response.body()
    assert.isTrue(responseBody.success)
    assert.exists(responseBody.entry)
    assert.equal(responseBody.entry.entryType, 'til')
    assert.equal(responseBody.entry.contentMarkdown, 'Today I learned about AJAX testing.')
    assert.deepEqual(responseBody.entry.tags, ['til'])

    // Verify entry was created with auto-generated title
    const entry = await Entry.query().where('entry_type', 'til').first()
    assert.isNotNull(entry)
    assert.isNotNull(entry!.title) // Should have auto-generated title
  })

  test('should create entry without tags via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'snippet',
        title: 'Code Snippet',
        contentMarkdown: '```javascript\nconsole.log("Hello World");\n```',
      })

    response.assertStatus(200)

    const responseBody = response.body()
    assert.isTrue(responseBody.success)
    assert.exists(responseBody.entry)
    assert.equal(responseBody.entry.title, 'Code Snippet')
    assert.equal(responseBody.entry.entryType, 'snippet')
    assert.deepEqual(responseBody.entry.tags, [])
  })

  test('should validate required fields when creating via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        // Missing entryType
        title: 'Invalid Entry',
        contentMarkdown: 'This should fail validation.',
      })

    response.assertStatus(422)

    const responseBody = response.body()
    assert.isFalse(responseBody.success)
    assert.equal(responseBody.message, 'Validation failed')
    assert.exists(responseBody.errors)
    assert.isArray(responseBody.errors)
  })

  test('should validate entry type when creating via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'invalid_type',
        title: 'Invalid Entry Type',
        contentMarkdown: 'This should fail validation.',
      })

    response.assertStatus(422)

    const responseBody = response.body()
    assert.isFalse(responseBody.success)
    assert.equal(responseBody.message, 'Validation failed')
    assert.exists(responseBody.errors)
  })

  test('should update existing entry via AJAX', async ({ client, assert }) => {
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

    // Add some tags to the entry
    const tag1 = await Tag.firstOrCreate(
      { name: 'original' },
      { name: 'original', slug: 'original', usageCount: 1 }
    )
    const tag2 = await Tag.firstOrCreate(
      { name: 'test' },
      { name: 'test', slug: 'test', usageCount: 1 }
    )
    await entry.related('tags').attach([tag1.id, tag2.id])

    const response = await client
      .put(`/entries/${entry.id}/ajax`)
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'til',
        title: 'Updated Title',
        contentMarkdown: '# Updated Content\n\nThis entry has been updated via AJAX.',
        tags: ['updated', 'ajax'],
      })

    response.assertStatus(200)

    const responseBody = response.body()
    assert.isTrue(responseBody.success)
    assert.equal(responseBody.message, 'Entry updated successfully.')
    assert.exists(responseBody.entry)
    assert.equal(responseBody.entry.id, entry.id)
    assert.equal(responseBody.entry.title, 'Updated Title')
    assert.equal(responseBody.entry.entryType, 'til')
    assert.equal(
      responseBody.entry.contentMarkdown,
      '# Updated Content\n\nThis entry has been updated via AJAX.'
    )
    assert.deepEqual(responseBody.entry.tags, ['updated', 'ajax'])

    // Verify entry was actually updated in database
    await entry.refresh()
    await entry.load('tags')
    assert.equal(entry.title, 'Updated Title')
    assert.equal(entry.entryType, 'til')
    assert.equal(
      entry.contentMarkdown,
      '# Updated Content\n\nThis entry has been updated via AJAX.'
    )
    assert.equal(entry.tags.length, 2)
    assert.includeMembers(
      entry.tags.map((tag) => tag.name),
      ['updated', 'ajax']
    )
  })

  test('should prevent unauthorized user from updating entry via AJAX', async ({
    client,
    assert,
  }) => {
    const user1 = await User.create({
      email: 'user1@example.com',
      password: 'password123',
    })

    const user2 = await User.create({
      email: 'user2@example.com',
      password: 'password123',
    })

    const entry = await Entry.create({
      userId: user1.id,
      entryType: 'daily',
      title: 'User 1 Entry',
      contentMarkdown: 'This belongs to user 1',
    })

    const response = await client
      .put(`/entries/${entry.id}/ajax`)
      .loginAs(user2) // Different user trying to update
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'til',
        title: 'Hacked Title',
        contentMarkdown: 'This should not work',
      })

    response.assertStatus(403)

    const responseBody = response.body()
    assert.isFalse(responseBody.success)
    assert.equal(responseBody.message, 'You are not authorized to update this entry.')

    // Verify entry was not updated
    await entry.refresh()
    assert.equal(entry.title, 'User 1 Entry')
    assert.equal(entry.entryType, 'daily')
    assert.equal(entry.contentMarkdown, 'This belongs to user 1')
  })

  test('should handle non-existent entry when updating via AJAX', async ({ client }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const fakeId = '12345678-1234-1234-1234-123456789012'

    const response = await client
      .put(`/entries/${fakeId}/ajax`)
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'daily',
        title: 'Non-existent Entry',
        contentMarkdown: 'This should fail',
      })

    response.assertStatus(404)
  })

  test('should validate fields when updating via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const entry = await Entry.create({
      userId: user.id,
      entryType: 'daily',
      title: 'Test Entry',
      contentMarkdown: 'Test content',
    })

    const response = await client
      .put(`/entries/${entry.id}/ajax`)
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'invalid_type', // Invalid entry type
        title: 'Updated Title',
        contentMarkdown: 'Updated content',
      })

    response.assertStatus(422)

    const responseBody = response.body()
    assert.isFalse(responseBody.success)
    assert.equal(responseBody.message, 'Validation failed')
    assert.exists(responseBody.errors)
  })

  test('should require authentication for AJAX endpoints', async ({ client }) => {
    // Test create endpoint without authentication
    const createResponse = await client
      .post('/entries/ajax')
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'daily',
        title: 'Unauthorized Entry',
        contentMarkdown: 'This should fail',
      })

    createResponse.assertStatus(401)

    // Test update endpoint without authentication
    const fakeId = '12345678-1234-1234-1234-123456789012'
    const updateResponse = await client
      .put(`/entries/${fakeId}/ajax`)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'daily',
        title: 'Unauthorized Update',
        contentMarkdown: 'This should fail',
      })

    updateResponse.assertStatus(401)
  })

  test('should handle content processing for AJAX entries', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const markdownContent = `# Test Entry

This is a **bold** text and this is *italic*.

\`\`\`javascript
console.log("Hello World");
\`\`\`

- List item 1
- List item 2

[Link](https://example.com)`

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'snippet',
        title: 'Content Processing Test',
        contentMarkdown: markdownContent,
        tags: ['markdown', 'processing'],
      })

    response.assertStatus(200)

    const responseBody = response.body()
    assert.isTrue(responseBody.success)
    assert.equal(responseBody.entry.contentMarkdown, markdownContent)

    // Verify content was processed in database
    const entry = await Entry.query().where('title', 'Content Processing Test').first()
    assert.isNotNull(entry)
    assert.equal(entry!.contentMarkdown, markdownContent)
    assert.isNotNull(entry!.contentHtml) // Should be processed to HTML
    assert.isNotNull(entry!.contentPlain) // Should be processed to plain text
  })

  test('should handle empty content gracefully via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'daily',
        title: 'Empty Content Entry',
        contentMarkdown: '',
      })

    response.assertStatus(200)

    const responseBody = response.body()
    assert.isTrue(responseBody.success)
    assert.equal(responseBody.entry.title, 'Empty Content Entry')
    assert.equal(responseBody.entry.contentMarkdown, '')
  })

  test('should handle large content via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    // Create content that's close to but under the 50000 character limit
    const largeContent = 'A'.repeat(49000)

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'daily',
        title: 'Large Content Entry',
        contentMarkdown: largeContent,
      })

    response.assertStatus(200)

    const responseBody = response.body()
    assert.isTrue(responseBody.success)
    assert.equal(responseBody.entry.contentMarkdown, largeContent)
  })

  test('should reject content that exceeds maximum length via AJAX', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    // Create content that exceeds the 50000 character limit
    const tooLargeContent = 'A'.repeat(50001)

    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        entryType: 'daily',
        title: 'Too Large Content Entry',
        contentMarkdown: tooLargeContent,
      })

    response.assertStatus(422)

    const responseBody = response.body()
    assert.isFalse(responseBody.success)
    assert.equal(responseBody.message, 'Validation failed')
  })
})
