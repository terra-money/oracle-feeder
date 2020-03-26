import * as sentry from '@sentry/node';
import * as logger from './logger';

export function errorHandler(error: any) {
  logger.error(error);
  sentry.captureException(error);
}
