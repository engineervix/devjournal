import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Api auth', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /api/v1/me returns authenticated user info', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
    })

    const response = await client.get('/api/v1/me').withGuard('api').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        id: user.id,
        email: 'test@example.com',
        fullName: 'Test User',
      },
    })

    // Verify response structure
    const body = response.body()
    assert.isTrue(body.success)
    assert.exists(body.data)
    assert.equal(body.data.id, user.id)
    assert.equal(body.data.email, user.email)
    assert.equal(body.data.fullName, user.fullName)
  })

  test('GET /api/v1/me requires authentication', async ({ client }) => {
    const response = await client.get('/api/v1/me')

    response.assertStatus(401)
    response.assertBodyContains({
      success: false,
      message: 'Authentication required.',
    })
  })

  test('GET /api/v1/me rejects invalid token', async ({ client }) => {
    const response = await client.get('/api/v1/me').bearerToken('invalid-token-xyz')

    response.assertStatus(401)
  })

  test('GET /api/v1/me works with real access token', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Token User',
      email: 'token@example.com',
      password: 'password',
    })

    // Create a real access token
    const token = await User.accessTokens.create(user, ['*'], {
      name: 'Test Token',
    })

    const response = await client.get('/api/v1/me').bearerToken(token.value!.release())

    response.assertStatus(200)
    assert.equal(response.body().data.email, 'token@example.com')
  })
})
