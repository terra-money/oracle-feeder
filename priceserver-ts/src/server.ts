import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as http from 'http';
import * as config from 'config';
import { initialize as initializeProviders } from './provider';

async function createServer() {
  const app = new Koa();
  const router = new Router();

  router.get('/health', ctx => {
    ctx.status = 200;
    ctx.body = 'OK';
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
  await initializeProviders();
  await createServer();
}

main().catch(e => {
  console.error(e);
});
