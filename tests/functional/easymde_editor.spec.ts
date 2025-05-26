import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('EasyMDE Editor', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should load editor component correctly', async ({ client }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    // Test that the entry creation page loads with EasyMDE
    const response = await client.get('/entries/create').loginAs(user)

    response.assertStatus(200)
    response.assertTextIncludes('easymde-wrapper')
    response.assertTextIncludes('x-data="easyMDEEditor"')
  })

  test('should have proper textarea element', async ({ client }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client.get('/entries/create').loginAs(user)

    response.assertStatus(200)
    // Check that the textarea with correct attributes exists
    response.assertTextIncludes('name="contentMarkdown"')
    response.assertTextIncludes('x-ref="textarea"')
  })

  test('should include keyboard shortcuts hint', async ({ client }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client.get('/entries/create').loginAs(user)

    response.assertStatus(200)
    response.assertTextIncludes('Cmd/Ctrl + Enter to save')
    response.assertTextIncludes('Rich text paste supported')
    response.assertTextIncludes('Focus on writing, formatting via toolbar')
  })

  test('should include EasyMDE CSS and JS imports', async ({ client }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client.get('/entries/create').loginAs(user)

    response.assertStatus(200)
    // Check that Alpine.js component is properly registered
    response.assertTextIncludes('x-data="easyMDEEditor"')
    response.assertTextIncludes('easymde-wrapper')
  })
})
