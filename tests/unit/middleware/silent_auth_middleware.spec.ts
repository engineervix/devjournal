import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import SilentAuthMiddleware from '#middleware/silent_auth_middleware'

test.group('Silent Auth Middleware', () => {
  test('should call auth.check() and continue to next', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()
    const middleware = new SilentAuthMiddleware()
    let nextCalled = false
    let authCheckCalled = false

    // Mock auth object and check method
    ctx.auth = {
      check: async () => {
        authCheckCalled = true
        return true
      },
    } as any

    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)

    assert.isTrue(authCheckCalled)
    assert.isTrue(nextCalled)
  })

  test('should continue even when auth.check() returns false', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()
    const middleware = new SilentAuthMiddleware()
    let nextCalled = false
    let authCheckCalled = false

    // Mock auth object and check method to return false
    ctx.auth = {
      check: async () => {
        authCheckCalled = true
        return false
      },
    } as any

    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)

    assert.isTrue(authCheckCalled)
    assert.isTrue(nextCalled)
  })

  test('should continue even when auth.check() throws an error', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()
    const middleware = new SilentAuthMiddleware()
    let nextCalled = false
    let authCheckCalled = false

    // Mock auth object and check method to throw an error
    ctx.auth = {
      check: async () => {
        authCheckCalled = true
        throw new Error('Auth failed')
      },
    } as any

    const next = async () => {
      nextCalled = true
    }

    // Should not throw an error and should continue
    await middleware.handle(ctx, next)

    assert.isTrue(authCheckCalled)
    assert.isTrue(nextCalled)
  })
})
