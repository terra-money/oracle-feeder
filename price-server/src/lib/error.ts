import * as sentry from '@sentry/node'
import * as logger from './logger'

interface Options {
  sentry?: string
}

export function init(opts: Options = {}): void {
  opts?.sentry && sentry.init({ dsn: opts.sentry })

  process.on('unhandledRejection', (error) => {
    error && logger.error(error)

    sentry.withScope((scope) => {
      scope.setLevel(sentry.Severity.Critical)
      sentry.captureException(error)
    })
  })
}

export function errorHandler(error: Error): void {
  if (error.message.includes('Invalid response')) {
    return
  }

  logger.error(error)
  sentry.captureException(error)
}
