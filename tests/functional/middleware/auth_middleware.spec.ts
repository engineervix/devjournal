import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Auth Middleware', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('redirects unauthenticated request to login with ?next= param', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/entries').redirects(0)

    response.assertStatus(302)
    const location = response.header('location')
    assert.isString(location)
    assert.match(location!, /\/\?next=%2Fentries/)
  })

  test('redirects to ?next= URL after successful login', async ({ client, assert }) => {
    await User.create({ email: 'test@example.com', password: 'password123' })

    const response = await client.post('/').withCsrfToken().redirects(0).form({
      email: 'test@example.com',
      password: 'password123',
      next: '/entries',
    })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/entries')
  })

  test('ignores unsafe ?next= values and redirects to /home after login', async ({
    client,
    assert,
  }) => {
    await User.create({ email: 'test@example.com', password: 'password123' })

    for (const unsafe of ['//evil.com', 'https://evil.com', 'http://evil.com']) {
      const response = await client.post('/').withCsrfToken().redirects(0).form({
        email: 'test@example.com',
        password: 'password123',
        next: unsafe,
      })

      response.assertStatus(302)
      assert.equal(response.header('location'), '/home', `expected /home for next=${unsafe}`)
    }
  })
})
