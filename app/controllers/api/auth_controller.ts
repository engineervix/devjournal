import { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  /**
   * Return authenticated user info for token validation
   * GET /api/v1/me
   */
  async me({ auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()

    return response.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  }
}
