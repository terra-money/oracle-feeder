import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as http from 'http'
import * as bluebird from 'bluebird'
import * as config from 'config'
import { init as initErrorHandler, errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { initialize as initializeProviders, getLunaPrices } from './provider'

bluebird.config({ longStackTraces: true })
global.Promise = bluebird

async function createServer() {
  const app = new Koa()
  const router = new Router()

  router.get('/health', ctx => {
    ctx.status = 200
    ctx.body = 'OK'
  })

  router.get('/latest', ctx => {
    const lunaPrices = getLunaPrices()
    ctx.body = {
      created_at: new Date().toISOString(),
      prices: Object.keys(lunaPrices).map(quote => ({
        currency: quote,
        price: lunaPrices[quote].toFixed(18)
      }))
    }

    ctx.status = 200
  })

  app.use(router.routes()).use(router.allowedMethods())

  const server = http.createServer(app.callback())

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
