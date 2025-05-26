import env from '#start/env'
import app from '@adonisjs/core/services/app'
import * as Sentry from '@sentry/node'
import { defineConfig, targets } from '@adonisjs/core/logger'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

// Initialize Sentry separately
if (app.inProduction) {
  Sentry.init({
    dsn: env.get('SENTRY_DSN'),
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
  })
}

const loggerConfig = defineConfig({
  default: 'app',

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ destination: 1 }))
          .pushIf(app.inProduction, {
            target: 'pino-sentry-transport',
            options: {
              dsn: env.get('SENTRY_DSN'),
              level: 'error',
            },
          })
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
