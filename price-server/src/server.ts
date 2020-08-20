import * as http from 'http'
import * as polka from 'polka'
import * as send from '@polka/send-type'
import * as bluebird from 'bluebird'
import * as config from 'config'
import { init as initErrorHandler, errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { initialize as initializeProviders, lunaProvider } from 'provider'
import { getQuoteCurrency } from 'lib/currency'

bluebird.config({ longStackTraces: true })
global.Promise = bluebird

async function createServer() {
  const app = polka({})

  app.get('/health', (req, res) => {
    res.end('OK')
  })

  app.get('/latest', (req, res) => {
    const lunaPrices = lunaProvider.getLunaPrices()

    send(res, 200, {
      created_at: new Date().toISOString(),
      prices: Object.keys(lunaPrices).map((symbol) => ({
        currency: getQuoteCurrency(symbol),
        price: lunaPrices[symbol].toFixed(18),
      })),
    })
  })

  const server = http.createServer(app.handler)

  server.listen(config.port, () => {
    logger.info(`price server is listening on port ${config.port}`)
  })

  return server
}

async function main(): Promise<void> {
  initErrorHandler(config.sentry)

  await createServer()
  await initializeProviders()
}

if (require.main === module) {
  main().catch(errorHandler)
}
