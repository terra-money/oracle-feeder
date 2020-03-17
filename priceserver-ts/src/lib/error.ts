import * as sentry from '@sentry/node';
import * as logger from './logger';

export function errorHandler(error: any) {
  sentry.captureException(error);
  logger.error(error);
}
