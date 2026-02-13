import { test } from '@japa/runner'
import nock from 'nock'
import TurnstileMiddleware from '#middleware/turnstile_middleware'
import TurnstileService from '#services/turnstile_service'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import env from '#start/env'

test.group('Turnstile Middleware', (group) => {
  // Clean up nock after each test
  group.each.teardown(() => {
    nock.cleanAll()
  })

  test('skips validation if keys are missing from env', async ({ assert }) => {
    // Temporarily mock env to return no keys
    const originalGet = env.get.bind(env)
    env.get = ((key: string) => {
      if (key === 'TURNSTILE_SECRET_KEY' || key === 'TURNSTILE_SITE_KEY') return undefined
      return originalGet(key)
    }) as any

    const service = new TurnstileService()
    const middleware = new TurnstileMiddleware(service)

    const ctx = new HttpContextFactory().create()
    let nextCalled = false
    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)
    assert.isTrue(nextCalled)

    // Restore
    env.get = originalGet
  })

  test('skips validation in development HTTP environment', async ({ assert }) => {
    // Temporarily mock env to return development and keys
    const originalGet = env.get.bind(env)
    env.get = ((key: string) => {
      if (key === 'NODE_ENV') return 'development'
      if (key === 'TURNSTILE_SECRET_KEY') return 'test-secret'
      if (key === 'TURNSTILE_SITE_KEY') return 'test-site-key'
      return originalGet(key)
    }) as any

    const service = new TurnstileService()
    const middleware = new TurnstileMiddleware(service)

    const ctx = new HttpContextFactory().create()
    // Ensure it's HTTP (not HTTPS)
    ctx.request.request.headers['x-forwarded-proto'] = 'http'

    let nextCalled = false
    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)
    assert.isTrue(nextCalled)

    // Restore
    env.get = originalGet
  })

  test('blocks request when token is missing', async ({ assert }) => {
    // Skip if Turnstile not configured
    if (!env.get('TURNSTILE_SECRET_KEY') || !env.get('TURNSTILE_SITE_KEY')) {
      assert.plan(0)
      return
    }

    const service = new TurnstileService()
    const middleware = new TurnstileMiddleware(service)

    const ctx = new HttpContextFactory().create()
    // Mock session flash
    ctx.session.flash = (() => {}) as any
    // Mock redirect
    let redirectCalled = false
    ctx.response.redirect = (() => {
      redirectCalled = true
      return {
        back: () => ctx.response,
      }
    }) as any

    let nextCalled = false
    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)

    assert.isFalse(nextCalled)
    assert.isTrue(redirectCalled)
  })

  test('blocks request when validation fails with user error', async ({ assert }) => {
    // Skip if Turnstile not configured
    if (!env.get('TURNSTILE_SECRET_KEY') || !env.get('TURNSTILE_SITE_KEY')) {
      assert.plan(0)
      return
    }

    // Mock failed validation
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, {
        'success': false,
        'error-codes': ['invalid-input-response'],
        'challenge_ts': '2026-02-13T12:00:00.000Z',
        'hostname': 'localhost',
      })

    const service = new TurnstileService()
    const middleware = new TurnstileMiddleware(service)

    const ctx = new HttpContextFactory().create()
    ctx.request.updateBody({ 'cf-turnstile-response': 'invalid-token' })

    // Mock session flash to capture message
    let flashedMessage = ''
    ctx.session.flash = ((key: string, value: any) => {
      if (key === 'error') flashedMessage = value
    }) as any
    // Mock redirect
    let redirectCalled = false
    ctx.response.redirect = (() => {
      redirectCalled = true
      return {
        back: () => ctx.response,
      }
    }) as any

    let nextCalled = false
    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)

    assert.isFalse(nextCalled)
    assert.isTrue(redirectCalled)
    assert.equal(flashedMessage, 'Security check failed. Please try again.')
  })

  test('blocks request with config error message', async ({ assert }) => {
    // Skip if Turnstile not configured
    if (!env.get('TURNSTILE_SECRET_KEY') || !env.get('TURNSTILE_SITE_KEY')) {
      assert.plan(0)
      return
    }

    // Mock config error
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, {
        'success': false,
        'error-codes': ['invalid-input-secret'],
        'challenge_ts': '2026-02-13T12:00:00.000Z',
        'hostname': 'localhost',
      })

    const service = new TurnstileService()
    const middleware = new TurnstileMiddleware(service)

    const ctx = new HttpContextFactory().create()
    ctx.request.updateBody({ 'cf-turnstile-response': 'test-token' })

    // Mock session flash to capture message
    let flashedMessage = ''
    ctx.session.flash = ((key: string, value: any) => {
      if (key === 'error') flashedMessage = value
    }) as any
    // Mock redirect
    let redirectCalled = false
    ctx.response.redirect = (() => {
      redirectCalled = true
      return {
        back: () => ctx.response,
      }
    }) as any

    let nextCalled = false
    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)

    assert.isFalse(nextCalled)
    assert.isTrue(redirectCalled)
    assert.equal(flashedMessage, 'Server configuration error. Please contact support.')
  })

  test('allows request when validation succeeds', async ({ assert }) => {
    // Skip if Turnstile not configured
    if (!env.get('TURNSTILE_SECRET_KEY') || !env.get('TURNSTILE_SITE_KEY')) {
      assert.plan(0)
      return
    }

    // Mock successful validation
    nock('https://challenges.cloudflare.com').post('/turnstile/v0/siteverify').reply(200, {
      'success': true,
      'error-codes': [],
      'challenge_ts': '2026-02-13T12:00:00.000Z',
      'hostname': 'localhost',
    })

    const service = new TurnstileService()
    const middleware = new TurnstileMiddleware(service)

    const ctx = new HttpContextFactory().create()
    ctx.request.updateBody({ 'cf-turnstile-response': 'valid-token' })

    let nextCalled = false
    const next = async () => {
      nextCalled = true
    }

    await middleware.handle(ctx, next)

    assert.isTrue(nextCalled)
  })
})
