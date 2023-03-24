import * as bluebird from 'bluebird'
import * as config from 'config'
import * as logger from './lib/logger'
import { init as initErrorHandler, errorHandler } from './lib/error'
import { initialize as initializeProviders, tick } from './provider'
import { createServer } from './server'
import { setupMetricsServer } from './lib/metrics'

bluebird.config({ longStackTraces: true })
global.Promise = bluebird as any

async function main(): Promise<void> {
  logger.info('price server start')

  initErrorHandler({ sentry: config.sentry })

  await setupMetricsServer()
  await initializeProviders()
  await createServer()

  await loop()
}

async function loop(): Promise<void> {
  while (true) {
    await tick(Date.now())

    await bluebird.delay(10)
  }
}

if (require.main === module) {
  main().catch(errorHandler)
}
