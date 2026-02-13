import { test } from '@japa/runner'
import nock from 'nock'
import TurnstileService from '#services/turnstile_service'
import env from '#start/env'

test.group('Turnstile Service', (group) => {
  // Clean up nock after each test
  group.each.teardown(() => {
    nock.cleanAll()
  })

  test('returns success for valid token', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock successful Cloudflare response
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, {
        success: true,
        'error-codes': [],
        challenge_ts: '2026-02-13T12:00:00.000Z',
        hostname: 'localhost',
      })

    const service = new TurnstileService()
    const result = await service.validateToken('valid-test-token')

    assert.isTrue(result.success)
    assert.isUndefined(result.errorCategory)
    assert.isUndefined(result.userMessage)
  })

  test('includes remoteip when IP address is provided', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock with body verification to check remoteip is included
    const scope = nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify', (body) => {
        // Verify remoteip is in the request body
        return body.includes('remoteip=192.168.1.100')
      })
      .reply(200, {
        success: true,
        'error-codes': [],
        challenge_ts: '2026-02-13T12:00:00.000Z',
        hostname: 'localhost',
      })

    const service = new TurnstileService()
    const result = await service.validateToken('valid-test-token', '192.168.1.100')

    assert.isTrue(result.success)
    assert.isTrue(scope.isDone(), 'Expected request with remoteip parameter')
  })

  test('works without remoteip when IP address is not provided', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock without remoteip in body
    const scope = nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify', (body) => {
        // Verify remoteip is NOT in the request body
        return !body.includes('remoteip')
      })
      .reply(200, {
        success: true,
        'error-codes': [],
        challenge_ts: '2026-02-13T12:00:00.000Z',
        hostname: 'localhost',
      })

    const service = new TurnstileService()
    const result = await service.validateToken('valid-test-token')

    assert.isTrue(result.success)
    assert.isTrue(scope.isDone(), 'Expected request without remoteip parameter')
  })

  test('categorizes invalid-input-response as user error', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock failed Cloudflare response
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, {
        success: false,
        'error-codes': ['invalid-input-response'],
        challenge_ts: '2026-02-13T12:00:00.000Z',
        hostname: 'localhost',
      })

    const service = new TurnstileService()
    const result = await service.validateToken('invalid-test-token')

    assert.isFalse(result.success)
    assert.equal(result.errorCategory, 'user')
    assert.deepEqual(result.errorCodes, ['invalid-input-response'])
    assert.equal(result.userMessage, 'Security check failed. Please try again.')
  })

  test('categorizes timeout-or-duplicate as user error', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock timeout-or-duplicate error (token already used)
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, {
        success: false,
        'error-codes': ['timeout-or-duplicate'],
        challenge_ts: '2026-02-13T12:00:00.000Z',
        hostname: 'localhost',
      })

    const service = new TurnstileService()
    const result = await service.validateToken('used-test-token')

    assert.isFalse(result.success)
    assert.equal(result.errorCategory, 'user')
    assert.deepEqual(result.errorCodes, ['timeout-or-duplicate'])
    assert.equal(result.userMessage, 'Security check expired. Please try again.')
  })

  test('categorizes invalid-input-secret as config error', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock config error
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, {
        success: false,
        'error-codes': ['invalid-input-secret'],
        challenge_ts: '2026-02-13T12:00:00.000Z',
        hostname: 'localhost',
      })

    const service = new TurnstileService()
    const result = await service.validateToken('test-token')

    assert.isFalse(result.success)
    assert.equal(result.errorCategory, 'config')
    assert.deepEqual(result.errorCodes, ['invalid-input-secret'])
    assert.equal(result.userMessage, 'Server configuration error. Please contact support.')
  })

  test('categorizes internal-error as system error', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock internal error
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, {
        success: false,
        'error-codes': ['internal-error'],
        challenge_ts: '2026-02-13T12:00:00.000Z',
        hostname: 'localhost',
      })

    const service = new TurnstileService()
    const result = await service.validateToken('test-token')

    assert.isFalse(result.success)
    assert.equal(result.errorCategory, 'system')
    assert.deepEqual(result.errorCodes, ['internal-error'])
    assert.equal(
      result.userMessage,
      'Security check temporarily unavailable. Please try again.'
    )
  })

  test('categorizes network error as system error', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock network error
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .replyWithError('Network connection failed')

    const service = new TurnstileService()
    const result = await service.validateToken('any-test-token')

    // Should fail closed (return error on network failure)
    assert.isFalse(result.success)
    assert.equal(result.errorCategory, 'system')
    assert.equal(
      result.userMessage,
      'Security check temporarily unavailable. Please try again.'
    )
  })

  test('categorizes malformed response as system error', async ({ assert }) => {
    // Skip test if Turnstile is not configured
    if (!env.get('TURNSTILE_SECRET_KEY')) {
      assert.plan(0)
      return
    }

    // Mock malformed response
    nock('https://challenges.cloudflare.com')
      .post('/turnstile/v0/siteverify')
      .reply(200, 'invalid json response')

    const service = new TurnstileService()
    const result = await service.validateToken('test-token')

    // Should fail closed (return error on parse error)
    assert.isFalse(result.success)
    assert.equal(result.errorCategory, 'system')
  })

  test('returns config error if secret key is missing', async ({ assert }) => {
    // This test does NOT require Turnstile to be configured
    // It verifies the service behavior when secret key is not configured
    const originalGet = env.get.bind(env)
    env.get = ((key: string) => {
      if (key === 'TURNSTILE_SECRET_KEY') return undefined
      return originalGet(key)
    }) as any

    const service = new TurnstileService()
    const result = await service.validateToken('test-token')

    assert.isFalse(result.success)
    assert.equal(result.errorCategory, 'config')
    assert.equal(result.userMessage, 'Server configuration error')

    // Restore original env.get
    env.get = originalGet
  })

  test('can instantiate service', ({ assert }) => {
    // Basic test that always runs regardless of configuration
    const service = new TurnstileService()
    assert.isDefined(service)
    assert.isFunction(service.validateToken)
  })
})
