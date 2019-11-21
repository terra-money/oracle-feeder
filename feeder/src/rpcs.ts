import axios from 'axios';
import * as Bluebird from 'bluebird';
import * as http from 'http';
import * as https from 'https';
import * as util from 'util';

const ENDPOINT_TX_BROADCAST = `/txs`;
const ENDPOINT_QUERY_LATEST_BLOCK = `/blocks/latest`;
const ENDPOINT_QUERY_ACCOUNT = `/auth/accounts/%s`;
const ENDPOINT_QUERY_PREVOTE = `/oracle/denoms/%s/prevotes/%s`;
const ENDPOINT_QUERY_TX = `/txs/%s`;

const secTimeout = 45;

const ax = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout: 15000
});

export async function queryAccount({ lcdAddress, voter }) {
  const url = util.format(lcdAddress + ENDPOINT_QUERY_ACCOUNT, voter.terraAddress);
  const res = await ax.get(url);

  if (!res.data.result || !res.data.result.value) {
    throw new Error('Failed to fetch account');
  }

  const { account_number, sequence } = res.data.result.value;

  if (typeof account_number !== 'string' || typeof sequence !== 'string') {
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

export async function queryTx({ lcdAddress, txhash }) {
  const res = await ax.get(util.format(lcdAddress + ENDPOINT_QUERY_TX, txhash)).catch(err => {
    if (err.response.status !== 404) {
      console.error(err.response.status, err.response.statusText);
    }
  });

  if (res) return res.data;
}

export async function waitTx({ lcdAddress, txhash }) {
  for (let t = 0; t < secTimeout; t += 1) {
    await Bluebird.delay(1000);
    const txQueryData = await queryTx({ lcdAddress, txhash });
    if (txQueryData) return txQueryData;
  }
}

export async function broadcast({ lcdAddress, broadcastReq }) {
  // Broadcast
  const { data } = await ax.post(lcdAddress + ENDPOINT_TX_BROADCAST, broadcastReq);
  return data;
}

export async function getPrices(sources: [string]): Promise<{ currency: string; price: string }[]> {
  console.info(`getting price data from`, sources);

  const results = await Bluebird.some(sources.map(s => ax.get(s)), 1).then(results =>
    results.filter(({ data }) => {
      if (typeof data.created_at !== 'string' || !Array.isArray(data.prices)) {
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
    throw new Error('could not fetch any price');
  }

  return results[0].data.prices;
}
