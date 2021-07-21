import { promises } from 'fs'
import * as path from 'path'
import * as bluebird from 'bluebird'
import * as config from 'config'
import * as logger from 'lib/logger'
import { init as initErrorHandler, errorHandler } from 'lib/error'
import { initialize as initializeProviders, tick } from 'provider'
import { createServer } from './server'
import * as defaultConfig from '../config/default-sample'

bluebird.config({ longStackTraces: true })
global.Promise = bluebird

async function convertOldConfig() {
  if (Array.isArray(config.fiatProvider.fallbackPriority)) {
    // new config. skip converting
    return
  }

  logger.warn('Config is outdated. Proceeding auto-convert (config/default.js will be overwritten)')

  config.lunaProvider = {
    adjustTvwapSymbols: ['LUNA/USDT'],
    huobi: { symbols: ['LUNA/USDT'] },
    binance: { symbols: ['LUNA/USDT'] },
    kucoin: { symbols: ['LUNA/USDT'] },
  }
  config.cryptoProvider = {
    adjustTvwapSymbols: ['USDT/USD'],
    bitfinex: { symbols: ['USDT/USD'] },
    kraken: { symbols: ['USDT/USD'] },
  }

  const fallbackPriority: string[] = ['exchangerate', 'bandprotocol']

  Object.keys(config.fiatProvider)
    .filter(
      (name) =>
        typeof config.fiatProvider[name] === 'object' && !Array.isArray(config.fiatProvider[name])
    )
    .forEach((name) => {
      const provider = config.fiatProvider[name]

      provider.symbols = defaultConfig.fiatSymbols

      if (provider.apiKey) {
        fallbackPriority.unshift(name)
      }
    })

  config.fiatProvider.fallbackPriority = fallbackPriority

  await promises.writeFile(
    path.resolve(__dirname, '..', 'config', 'default.js'),
    `module.exports = ${JSON.stringify(config, null, 2)}\n`,
    'utf8'
  )
}

async function main(): Promise<void> {
  logger.info('price server start')

  initErrorHandler({ sentry: config.sentry })

  await convertOldConfig()
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
