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
      // For AJAX requests, return JSON response instead of redirect
      if (ctx.request.ajax() || ctx.request.header('X-Requested-With') === 'XMLHttpRequest') {
        return ctx.response.status(401).json({
          success: false,
          message: 'Authentication required.',
        })
      }
      // For regular requests, let the default behavior handle it (redirect)
      throw error
    }
  }
}
