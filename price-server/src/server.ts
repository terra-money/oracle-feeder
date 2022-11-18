import * as http from 'http'
import * as polka from 'polka'
import * as send from '@polka/send-type'
import * as bluebird from 'bluebird'
import * as config from 'config'
import * as logger from 'lib/logger'
import { getBaseCurrency, getQuoteCurrency } from 'lib/currency'
import { getCryptoPrices, getFiatPrices } from 'prices'
import { countAllRequests } from 'lib/metrics'

bluebird.config({ longStackTraces: true })
global.Promise = bluebird

export async function createServer(): Promise<http.Server> {
  const app = polka({})

  app.use(countAllRequests())

  app.get('/health', (_, res) => {
    res.end('OK')
  })

  app.get('/latest', (_, res) => {
    const cryptoPrices = getCryptoPrices()
    const fiatPrices = getFiatPrices()

    const prices = [
      ...Object.keys(cryptoPrices).map((symbol) => ({
        denom: getBaseCurrency(symbol),
        price: cryptoPrices[symbol].toFixed(6),
      })),
      ...Object.keys(fiatPrices).map((symbol) => ({
        denom: getQuoteCurrency(symbol),
        price: fiatPrices[symbol].toFixed(6),
      })),
    ]

    send(res, 200, {
      creationDate: new Date().toISOString(),
      prices,
    })
  })

  app.get('/latest/fiat', (_, res) => {
    const fiatPrices = getFiatPrices()

    send(res, 200, {
      creationDate: new Date().toISOString(),
      prices: Object.keys(fiatPrices).map((symbol) => ({
        denom: getQuoteCurrency(symbol),
        price: fiatPrices[symbol].toFixed(6),
      })),
    })
  })

  app.get('/latest/crypto/top', (_, res) => {
    const cryptoPrices = getCryptoPrices()

    send(res, 200, {
      creationDate: new Date().toISOString(),
      prices: Object.keys(cryptoPrices).map((symbol) => ({
        denom: getBaseCurrency(symbol),
        price: cryptoPrices[symbol].toFixed(6),
      })),
    })
  })

  const server = http.createServer(app.handler)

  server.listen(config.port, () => {
    logger.info(`price server is listening on port ${config.port}`)
  })

  return server
}
