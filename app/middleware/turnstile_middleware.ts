import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

interface TurnstileResponse {
  'success': boolean
  'challenge_ts': string
  'hostname': string
  'error-codes'?: string[]
  'action'?: string
  'cdata'?: string
}

export default class TurnstileMiddleware {
  private async validateToken(token: string): Promise<boolean> {
    try {
      const secretKey = env.get('TURNSTILE_SECRET_KEY')
      if (!secretKey) {
        logger.error('Turnstile secret key not configured')
        return false
      }

      const formData = new URLSearchParams()
      formData.append('secret', secretKey)
      formData.append('response', token)

      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const outcome = (await result.json()) as TurnstileResponse

      if (!outcome.success && outcome['error-codes']) {
        logger.error('Turnstile validation failed: %o', {
          errors: outcome['error-codes'],
          hostname: outcome.hostname,
          timestamp: outcome.challenge_ts,
          action: outcome.action,
        })
      }

      return outcome.success === true
    } catch (error) {
      logger.error('Turnstile validation error: %o', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return false
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const secretKey = env.get('TURNSTILE_SECRET_KEY')
    const siteKey = env.get('TURNSTILE_SITE_KEY')

    // Skip validation only if Turnstile is not configured (both keys missing)
    if (!secretKey || !siteKey) {
      logger.debug('Turnstile not configured - skipping validation')
      return next()
    }

    // Skip validation in development environment only if explicitly not using HTTPS
    // This allows testing with localhost HTTPS setups
    const isDevelopment = env.get('NODE_ENV') !== 'production'
    const isHttpsRequest = ctx.request.completeUrl().startsWith('https')

    if (isDevelopment && !isHttpsRequest) {
      logger.debug('Skipping Turnstile validation in development HTTP environment')
      return next()
    }

    const token = ctx.request.input('cf-turnstile-response')

    if (!token) {
      logger.info('Missing Turnstile response token', {
        ip: ctx.request.ip(),
        url: ctx.request.url(),
        userAgent: ctx.request.header('user-agent'),
      })
      ctx.session.flash('errors', { form: 'Please complete the security challenge' })
      return ctx.response.redirect().back()
    }

    const isValid = await this.validateToken(token)

    if (!isValid) {
      logger.warn('Failed Turnstile validation', {
        ip: ctx.request.ip(),
        url: ctx.request.url(),
        userAgent: ctx.request.header('user-agent'),
      })
      ctx.session.flash('errors', { form: 'Security challenge failed. Please try again.' })
      return ctx.response.redirect().back()
    }

    logger.info('Turnstile validation successful', {
      ip: ctx.request.ip(),
      url: ctx.request.url(),
    })

    return next()
  }
}
