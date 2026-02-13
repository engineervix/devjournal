import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import TurnstileService from '#services/turnstile_service'

@inject()
export default class TurnstileMiddleware {
  constructor(private turnstileService: TurnstileService) {}

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
      ctx.session.flash('error', 'Please complete the security challenge')
      return ctx.response.redirect().back()
    }

    // Validate token with Cloudflare, including visitor IP for fraud detection
    const result = await this.turnstileService.validateToken(token, ctx.request.ip())

    if (!result.success) {
      // Log validation failure with context
      logger.warn('Failed Turnstile validation', {
        ip: ctx.request.ip(),
        url: ctx.request.url(),
        userAgent: ctx.request.header('user-agent'),
        errorCategory: result.errorCategory,
        errorCodes: result.errorCodes,
      })

      // Use specific user message from service, or fallback to generic
      const errorMessage = result.userMessage || 'Security challenge failed. Please try again.'
      ctx.session.flash('error', errorMessage)
      return ctx.response.redirect().back()
    }

    return next()
  }
}
