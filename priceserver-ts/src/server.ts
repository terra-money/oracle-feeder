import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as http from 'http';
import * as bluebird from 'bluebird';
import * as sentry from '@sentry/node';
import * as config from 'config';
import { initialize as initializeProviders, getLunaPrices } from './provider';

global.Promise = bluebird;
sentry.init({ dsn: 'https://18d6520fae464a2687d2426f259dc74f@sentry.io/3641117' });

process.on('unhandledRejection', error => {
  console.error(error);

  sentry.withScope(scope => {
    scope.setLevel(sentry.Severity.Critical);
    sentry.captureException(error);
  });
});

async function createServer() {
  const app = new Koa();
  const router = new Router();

  router.get('/health', ctx => {
    ctx.status = 200;
    ctx.body = 'OK';
  });

  router.get('/latest', ctx => {
    const lunaPrices = getLunaPrices();
    ctx.body = {
      created_at: new Date().toISOString(),
      prices: Object.keys(lunaPrices).map(quote => ({
        currency: quote,
        price: lunaPrices[quote].toFixed(18)
      }))
    };

    ctx.status = 200;
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const server = http.createServer(app.callback());

  server.listen(config.port, () => {
    console.log(`price server is listening on port ${config.port}`);
  });

  return server;
}

async function main(): Promise<void> {
  await createServer();
  await initializeProviders();
}

main().catch(e => {
  console.error(e);
});
