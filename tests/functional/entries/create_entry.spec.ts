/**
 * Functional tests for entry creation endpoint
 *
 * Key Testing Patterns & Lessons Learned:
 *
 * 1. REDIRECT TESTING:
 *    - Use .redirects(0) to disable automatic redirect following
 *    - Test the actual 302 redirect response instead of the final 200 page
 *    - Check Location header instead of response.redirects() when redirects are disabled
 *
 * 2. CONTENT NEGOTIATION:
 *    - Successful operations (expecting redirects): Don't use Accept: application/json
 *    - Validation/Error tests: Use Accept: application/json to get structured error responses
 *    - AdonisJS uses content negotiation to decide between redirects vs JSON responses
 *
 * 3. CONTENT PROCESSING:
 *    - html-to-text library may convert text to uppercase
 *    - Use .toLowerCase() in assertions for consistent text comparisons
 *
 * 4. DATABASE TRANSACTIONS:
 *    - Each test uses testUtils.db().withGlobalTransaction() for isolation
 *    - Tests automatically rollback after completion
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Entry from '#models/entry'
import Tag from '#models/tag'

test.group('Entries - Create', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create a new entry with valid data', async ({ client, assert }) => {
    // Create a test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries')
      .loginAs(user)
      .withCsrfToken()
      // Disable redirect following to test the actual redirect response (302)
      // instead of the final page after redirect (200). This allows us to
      // verify that the controller is properly redirecting on success.
      .redirects(0)
      .form({
        entryType: 'daily',
        title: 'My Daily Log',
        contentMarkdown: '# Today was great\n\nI learned a lot!',
        tags: ['learning', 'productivity'],
      })

    response.assertStatus(302)
    // Check that it redirects to an entries show page by examining the Location header
    // (since we disabled redirect following, we check the header instead of response.redirects())
    const location = response.header('location')
    assert.isString(location)
    assert.match(location!, /\/entries\/[a-f0-9-]+$/)

    // Verify entry was created
    const entry = await Entry.query().where('user_id', user.id).first()
    assert.isNotNull(entry)
    assert.equal(entry!.title, 'My Daily Log')
    assert.equal(entry!.entryType, 'daily')
    assert.equal(entry!.contentMarkdown, '# Today was great\n\nI learned a lot!')

    // Verify content was processed
    assert.isNotNull(entry!.contentHtml)
    assert.include(entry!.contentHtml!, '<h1>Today was great</h1>')
    assert.isNotNull(entry!.contentPlain)
    // Note: html-to-text library converts text to uppercase, so we use toLowerCase()
    // for consistent assertions across different html-to-text configurations
    assert.include(entry!.contentPlain!.toLowerCase(), 'today was great')

    // Verify tags were created and attached
    await entry!.load('tags')
    assert.lengthOf(entry!.tags, 2)

    const tagNames = entry!.tags.map((tag) => tag.name).sort()
    assert.deepEqual(tagNames, ['learning', 'productivity'])
  })

  test('should auto-generate title for daily entries', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries')
      .loginAs(user)
      .withCsrfToken()
      // Disable redirect following to test the 302 redirect response
      .redirects(0)
      .form({
        entryType: 'daily',
        contentMarkdown: 'Some content',
      })

    response.assertStatus(302)
    // Check that it redirects to an entries show page
    const location = response.header('location')
    assert.isString(location)
    assert.match(location!, /\/entries\/[a-f0-9-]+$/)

    const entry = await Entry.query().where('user_id', user.id).first()
    assert.isNotNull(entry)
    assert.include(entry!.title!, 'Daily Log -')
  })

  test('should handle entry creation without tags', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries')
      .loginAs(user)
      .withCsrfToken()
      // Disable redirect following to test the 302 redirect response
      .redirects(0)
      .form({
        entryType: 'til',
        title: 'TIL Entry',
        contentMarkdown: 'Today I learned something new',
      })

    response.assertStatus(302)
    // Check that it redirects to an entries show page
    const location = response.header('location')
    assert.isString(location)
    assert.match(location!, /\/entries\/[a-f0-9-]+$/)

    const entry = await Entry.query().where('user_id', user.id).preload('tags').first()
    assert.isNotNull(entry)
    assert.lengthOf(entry!.tags, 0)
  })

  test('should increment tag usage count when creating entry', async ({ client, assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    // Create an existing tag
    const existingTag = await Tag.create({
      name: 'existing',
      slug: 'existing',
      usageCount: 5,
    })

    const response = await client
      .post('/entries')
      .loginAs(user)
      .withCsrfToken()
      // Disable redirect following to test the 302 redirect response
      .redirects(0)
      .form({
        entryType: 'snippet',
        title: 'Code Snippet',
        contentMarkdown: 'console.log("hello")',
        tags: ['existing', 'new-tag'],
      })

    response.assertStatus(302)
    // Check that it redirects to an entries show page
    const location = response.header('location')
    assert.isString(location)
    assert.match(location!, /\/entries\/[a-f0-9-]+$/)

    // Check existing tag usage count was incremented
    await existingTag.refresh()
    assert.equal(existingTag.usageCount, 6)

    // Check new tag was created with usage count 1
    const newTag = await Tag.findBy('slug', 'new-tag')
    assert.isNotNull(newTag)
    assert.equal(newTag!.usageCount, 1)
  })

  test('should validate required fields', async ({ client }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries')
      .loginAs(user)
      .withCsrfToken()
      // Use JSON Accept header for validation tests to get structured error responses
      // instead of HTML error pages. This allows us to test the 422 status code
      // that AdonisJS returns for validation errors when JSON is requested.
      .header('Accept', 'application/json')
      .form({
        // Missing entryType
        title: 'Test Entry',
      })

    response.assertStatus(422)
  })

  test('should validate entry type enum', async ({ client }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/entries')
      .loginAs(user)
      .withCsrfToken()
      // Use JSON Accept header for validation tests (see comment above)
      .header('Accept', 'application/json')
      .form({
        entryType: 'invalid-type',
        title: 'Test Entry',
      })

    response.assertStatus(422)
  })

  test('should require authentication', async ({ client }) => {
    const response = await client
      .post('/entries')
      .withCsrfToken()
      // Use JSON Accept header for authentication tests to get 401 status
      // instead of redirect to login page
      .header('Accept', 'application/json')
      .form({
        entryType: 'daily',
        title: 'Test Entry',
      })

    response.assertStatus(401)
  })
})
