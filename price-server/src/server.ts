import * as http from 'http'
import * as polka from 'polka'
import * as send from '@polka/send-type'
import * as bluebird from 'bluebird'
import * as config from 'config'
import * as logger from 'lib/logger'
import { getQuoteCurrency } from 'lib/currency'
import { getLunaPrices } from 'prices'
import { countAllRequests } from 'lib/metrics'

bluebird.config({ longStackTraces: true })
global.Promise = bluebird

export async function createServer(): Promise<http.Server> {
  const app = polka({})

  app.use(countAllRequests())

  app.get('/health', (req, res) => {
    res.end('OK')
  })

  app.get('/latest', (req, res) => {
    const lunaPrices = getLunaPrices()

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
