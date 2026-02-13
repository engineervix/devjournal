import { inject } from '@adonisjs/core'
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

export interface ValidationResult {
  success: boolean
  errorCategory?: 'config' | 'user' | 'system' | 'security'
  errorCodes?: string[]
  userMessage?: string
}

@inject()
export default class TurnstileService {
  /**
   * Validate Turnstile token with Cloudflare
   *
   * @param token - The Turnstile response token from the client
   * @param ipAddress - Optional visitor IP address for enhanced fraud detection
   * @returns ValidationResult with success status, error category, and user-facing message
   */
  async validateToken(token: string, ipAddress?: string): Promise<ValidationResult> {
    try {
      const secretKey = env.get('TURNSTILE_SECRET_KEY')
      if (!secretKey) {
        logger.error('Turnstile secret key not configured')
        return {
          success: false,
          errorCategory: 'config',
          userMessage: 'Server configuration error',
        }
      }

      const formData = new URLSearchParams()
      formData.append('secret', secretKey)
      formData.append('response', token)

      // Include IP address for enhanced fraud detection and pattern analysis
      if (ipAddress) {
        formData.append('remoteip', ipAddress)
      }

      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const outcome = (await result.json()) as TurnstileResponse

      if (!outcome.success && outcome['error-codes']) {
        return this.categorizeError(outcome['error-codes'], ipAddress, outcome)
      }

      return { success: true }
    } catch (error) {
      logger.error('Turnstile validation network error: %o', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ip: ipAddress,
      })
      return {
        success: false,
        errorCategory: 'system',
        userMessage: 'Security check temporarily unavailable. Please try again.',
      }
    }
  }

  /**
   * Categorize Turnstile error codes and return appropriate result
   *
   * @param errorCodes - Array of error codes from Cloudflare
   * @param ipAddress - Optional IP address for logging context
   * @param outcome - Full Turnstile response for additional context
   * @returns ValidationResult with appropriate category and user message
   */
  private categorizeError(
    errorCodes: string[],
    ipAddress?: string,
    outcome?: TurnstileResponse
  ): ValidationResult {
    // Configuration errors - CRITICAL - Affects all users
    const configErrors = ['missing-input-secret', 'invalid-input-secret']
    if (errorCodes.some((code) => configErrors.includes(code))) {
      logger.fatal('🚨 TURNSTILE CONFIG ERROR - FIX IMMEDIATELY', {
        errors: errorCodes,
        hostname: outcome?.hostname,
        timestamp: outcome?.challenge_ts,
        message: 'Configuration error affects all users',
      })
      return {
        success: false,
        errorCategory: 'config',
        errorCodes,
        userMessage: 'Server configuration error. Please contact support.',
      }
    }

    // Token expired or duplicate - Normal user behavior
    if (errorCodes.includes('timeout-or-duplicate')) {
      logger.info('Turnstile token expired or already used', {
        errors: errorCodes,
        ip: ipAddress,
        hostname: outcome?.hostname,
      })
      return {
        success: false,
        errorCategory: 'user',
        errorCodes,
        userMessage: 'Security check expired. Please try again.',
      }
    }

    // Invalid token - User needs to retry
    if (errorCodes.includes('invalid-input-response')) {
      logger.info('Turnstile token invalid or malformed', {
        errors: errorCodes,
        ip: ipAddress,
        hostname: outcome?.hostname,
      })
      return {
        success: false,
        errorCategory: 'user',
        errorCodes,
        userMessage: 'Security check failed. Please try again.',
      }
    }

    // Missing token - Request problem
    if (errorCodes.includes('missing-input-response')) {
      logger.warn('Turnstile token missing from request', {
        errors: errorCodes,
        ip: ipAddress,
        hostname: outcome?.hostname,
      })
      return {
        success: false,
        errorCategory: 'user',
        errorCodes,
        userMessage: 'Please complete the security challenge.',
      }
    }

    // Cloudflare internal error - System issue
    if (errorCodes.includes('internal-error')) {
      logger.warn('Turnstile service error - Cloudflare issue', {
        errors: errorCodes,
        hostname: outcome?.hostname,
        timestamp: outcome?.challenge_ts,
        message: 'Cloudflare experiencing issues',
      })
      return {
        success: false,
        errorCategory: 'system',
        errorCodes,
        userMessage: 'Security check temporarily unavailable. Please try again.',
      }
    }

    // Malformed request
    if (errorCodes.includes('bad-request')) {
      logger.error('Turnstile bad request', {
        errors: errorCodes,
        ip: ipAddress,
        hostname: outcome?.hostname,
      })
      return {
        success: false,
        errorCategory: 'system',
        errorCodes,
        userMessage: 'Security check failed. Please try again.',
      }
    }

    // Unknown error - Log for investigation
    logger.error('Turnstile validation failed with unknown error', {
      errors: errorCodes,
      ip: ipAddress,
      hostname: outcome?.hostname,
      timestamp: outcome?.challenge_ts,
    })
    return {
      success: false,
      errorCategory: 'system',
      errorCodes,
      userMessage: 'Security check failed. Please try again.',
    }
  }
}
