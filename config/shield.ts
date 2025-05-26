import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: true,
    directives: {
      defaultSrc: ["'self'"],

      // Scripts
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdnjs.cloudflare.com',
        'https://challenges.cloudflare.com', // For Turnstile
        'https://static.cloudflareinsights.com', // For Cloudflare analytics
      ],

      // Styles
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for Tailwind/DaisyUI

      // Images
      imgSrc: ["'self'", 'data:', 'https:'],

      // Connections
      connectSrc: ["'self'", 'https://*.cloudflare.com'],

      // Fonts
      fontSrc: ["'self'", 'https:'],

      // Frames - needed for Turnstile
      frameSrc: ['https://challenges.cloudflare.com'],

      // Disable unused resource types
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
    },
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: false,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  // hsts: {
  //   enabled: true,
  //   maxAge: '180 days',
  // },

  // Disable HSTS in AdonisJS since we're handling it via reverse proxy
  hsts: {
    enabled: false,
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
