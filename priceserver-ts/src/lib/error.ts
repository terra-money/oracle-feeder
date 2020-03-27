import * as sentry from '@sentry/node'
import * as logger from './logger'

export function errorHandler(error: any) {
  if (typeof error === 'string' && error === 'skip') {
    return
  }

  logger.error(error)
  sentry.captureException(error)
}
