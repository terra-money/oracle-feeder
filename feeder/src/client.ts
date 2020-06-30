import axios from 'axios';
import * as Bluebird from 'bluebird';
import * as http from 'http';
import * as https from 'https';
import * as util from 'util';
import { StdTx, Coin } from './msg';

const ENDPOINT_TX_BROADCAST = `/txs`;
const ENDPOINT_QUERY_LATEST_BLOCK = `/blocks/latest`;
const ENDPOINT_QUERY_ACCOUNT = `/auth/accounts/%s`;
const ENDPOINT_TX_ESTIMATE_FEE = `/txs/estimate_fee`;

const ax = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout: 30000,
  headers: {
    post: {
      'Content-Type': 'application/json',
    },
  },
});

export async function queryAccount(lcdAddress: string, address: string) {
  const url = util.format(lcdAddress + ENDPOINT_QUERY_ACCOUNT, address);
  const res = await ax.get(url);

  if (!res.data.result || !res.data.result.value) {
    throw new Error('Failed to fetch account');
  }

  const { account_number, sequence } = res.data.result.value;

  if (typeof account_number !== 'number' || typeof sequence !== 'number') {
    throw new Error('Failed to fetch account number and sequence');
  }

  return res.data.result.value;
}

export async function queryOracleParams({ lcdAddress }) {
  const { data } = await ax.get(`${lcdAddress}/oracle/parameters`);
  return data.result;
}

export async function queryLatestBlock({ lcdAddress }) {
  const res = await ax.get(lcdAddress + ENDPOINT_QUERY_LATEST_BLOCK);
  if (res) return res.data;
}

// the broadcast body consists of the signed tx and a return type
// returnType can be block (inclusion in block), async (right away), sync (after checkTx has passed)
export function createBroadcastBody(tx: StdTx, mode: string = `sync`) {
  if (!['async', 'sync', 'block'].includes(mode)) {
    throw TypeError(`unknown broadcast mode ${mode}`);
  }

  return JSON.stringify({
    tx,
    mode,
  });
}

export async function estimateTax(
  lcdAddress: string,
  tx: StdTx
): Promise<{
  amount: Coin[];
  gas: string;
}> {
  const { data: { result } } = await ax.post(
    lcdAddress + ENDPOINT_TX_ESTIMATE_FEE,
    JSON.stringify({
      tx,
      gas_prices: [{ amount: '0.015', denom: 'ukrw' }],
      gas_adjustment: '1.4',
    })
  );

  return {
    amount: result.fees,
    gas: result.gas
  };
}

export async function broadcast(lcdAddress: string, tx: StdTx, mode: string) {
  const body = createBroadcastBody(tx, mode);
  // Broadcast
  const { data } = await ax.post(lcdAddress + ENDPOINT_TX_BROADCAST, body);

  if (data.code) {
    if (data.height !== '0') {
      throw new Error(`successful tx with error: ${data.raw_log}, hash: ${data.txhash}`);
    }

    console.error(`broadcast error: ${data.raw_log}`);
    return -1;
  }

  // if broadcast mode is `block` return immediately.
  if (mode !== 'sync') {
    return data.height ? +data.height : -1;
  }

  const AVERAGE_BLOCK_TIME = 6500;
  const MAX_RETRY_COUNT = 10;

  // Wait for next block
  await Bluebird.delay(AVERAGE_BLOCK_TIME);

  for (let i = 0; i < MAX_RETRY_COUNT; i += 1) {
    const height: string = await ax
      .get(`${lcdAddress}/txs/${data.txhash}`)
      .then(({ data: tx }) => {
        if (tx.code) {
          throw new Error(`successful tx with error: ${tx.raw_log}, hash: ${data.txhash}`);
        }

        console.info(`txhash: ${tx.txhash}`);
        return tx.height;
      })
      .catch((err) => {
        if (err.isAxiosError) {
          console.info(`tx not found yet: ${err.message}, hash: ${data.txhash}`);
          return '';
        }

        throw err;
      });

    if (height) {
      return +height;
    }

    await Bluebird.delay(AVERAGE_BLOCK_TIME);
  }

  throw new Error(`broadcast retrying failed: hash ${data.txhash}`);
}

export async function getPrices(sources: [string]): Promise<{ currency: string; price: string }[]> {
  console.info(`getting price data from`, sources);

  const results = await Bluebird.some(
    sources.map((s) => ax.get(s)),
    1
  ).then((results) =>
    results.filter(({ data }) => {
      if (
        typeof data.created_at !== 'string' ||
        !Array.isArray(data.prices) ||
        !data.prices.length
      ) {
        console.error('invalid price response');
        return false;
      }

      // Ignore prices older than 60 seconds ago
      if (Date.now() - new Date(data.created_at).getTime() > 60 * 1000) {
        console.info('price is too old');
        return false;
      }

      return true;
    })
  );

  if (!results.length) {
    return [];
  }

  return results[0].data.prices;
}
