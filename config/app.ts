import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import { defineConfig } from '@adonisjs/core/http'
import proxyAddr from 'proxy-addr'

/**
 * The app key is used for encrypting cookies, generating signed URLs,
 * and by the "encryption" module.
 *
 * The encryption module will fail to decrypt data if the key is lost or
 * changed. Therefore it is recommended to keep the app key secure.
 */
export const appKey = new Secret(env.get('APP_KEY'))

/**
 * The configuration settings used by the HTTP server
 */
export const http = defineConfig({
  generateRequestId: true,
  allowMethodSpoofing: true,

  /**
   * Enabling async local storage will let you access HTTP context
   * from anywhere inside your application.
   */
  useAsyncLocalStorage: false,

  /**
   * Configure trusted proxies for proper IP extraction.
   * Using proxy-addr for robust CIDR support
   * 'uniquelocal' covers private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
   */
  trustProxy: proxyAddr.compile([
    'loopback', // Trust loopback addresses (127.0.0.1/8, ::1/128)
    'linklocal', // Trust link-local addresses (169.254.0.0/16, fe80::/10)
    'uniquelocal', // Trust private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
  ]),

  /**
   * Custom IP extraction method to handle Cloudflare's CF-Connecting-IP header
   * and fallback to standard proxy headers.
   */
  getIp(request) {
    // First check CF-Connecting-IP (Cloudflare's real IP header)
    const cfIP = request.header('CF-Connecting-IP')
    if (cfIP) {
      return cfIP
    }

    // Also check X-Real-IP as another common header
    const realIP = request.header('X-Real-IP')
    if (realIP) {
      return realIP
    }

    // Fallback to X-Forwarded-For using the standard AdonisJS method
    // Since we've configured trustProxy above, this will properly parse the header
    const ips = request.ips()
    if (ips.length > 0) {
      return ips[0]
    }

    // Final fallback to the socket remote address
    return request.ctx?.req?.socket?.remoteAddress || '127.0.0.1'
  },

  /**
   * Manage cookies configuration. The settings for the session id cookie are
   * defined inside the "config/session.ts" file.
   */
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
})
