import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   *
   * Note: This is set to '/' because our login route is at the root path,
   * not '/login'. This ensures unauthenticated users are redirected to
   * the correct login page.
   */
  redirectTo = '/'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    try {
      await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
      return next()
    } catch (error) {
      // For API requests (with Authorization header or /api/ path), return JSON response
      const isApiRequest =
        ctx.request.header('Authorization') !== undefined || ctx.request.url().startsWith('/api/')

      // For AJAX, API, or JSON-accepting requests, return JSON response instead of redirect
      const acceptsJson = ctx.request.accepts(['html', 'json']) === 'json'
      if (
        ctx.request.ajax() ||
        ctx.request.header('X-Requested-With') === 'XMLHttpRequest' ||
        isApiRequest ||
        acceptsJson
      ) {
        return ctx.response.status(401).json({
          success: false,
          message: 'Authentication required.',
        })
      }

      // Redirect to login with ?next= so the user is returned after login
      const requestUrl = ctx.request.url(true)
      return ctx.response.redirect(`${this.redirectTo}?next=${encodeURIComponent(requestUrl)}`)
    }
  }
}
