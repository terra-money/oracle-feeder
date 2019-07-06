import * as http from 'http';
import * as https from 'https';
import * as Bluebird from 'bluebird';
import axios from 'axios';
import * as util from 'util';
import * as promptly from 'promptly';
import { ArgumentParser } from 'argparse';
import delay from 'delay';
import * as CryptoJS from 'crypto-js';

import * as wallet from './wallet';
import * as keystore from './keystore';
import * as msg from './msg';

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

function registerCommands(parser: ArgumentParser): void {
  const subparsers = parser.addSubparsers({
    title: `commands`,
    dest: `subparser_name`,
    description: `Aavailable commands`
  });

  // Voting command
  const voteCommand = subparsers.addParser(`vote`, {
    addHelp: true,
    description: `Get price data from sources, vote for all denoms in data`
  });

  voteCommand.addArgument([`--ledger`], {
    action: `storeTrue`,
    help: `using ledger`,
    dest: 'ledgerMode',
    defaultValue: false
  });

  voteCommand.addArgument(['-l', '--lcd'], {
    action: 'store',
    help: 'lcd address',
    dest: 'lcdAddress',
    required: true
  });

  voteCommand.addArgument([`-c`, `--chain-id`], {
    action: `store`,
    help: `chain ID`,
    dest: `chainID`,
    required: true
  });

  voteCommand.addArgument([`--validator`], {
    action: `append`,
    help: `validator address (e.g. terravaloper1...), can have multiple`,
    required: false
  });

  voteCommand.addArgument([`-s`, `--source`], {
    action: `append`,
    help: `Append price data source(It can handle multiple sources)`,
    required: true
  });

  voteCommand.addArgument([`-p`, `--password`], {
    action: `store`,
    help: `voter password`
  });

  voteCommand.addArgument([`-d`, `--denoms`], {
    action: `store`,
    help: `denom list to vote (ex: "all" or "krw,eur,usd")`,
    defaultValue: `all`
  });

  voteCommand.addArgument([`-k`, `--keystore`], {
    action: `store`,
    help: `key store path to save encrypted key`,
    defaultValue: `voter.json`
  });

  // Updating Key command
  const keyCommand = subparsers.addParser(`update-key`, { addHelp: true });

  keyCommand.addArgument([`-k`, `--keystore`], {
    action: `store`,
    help: `key store path to save encrypted key`,
    defaultValue: `voter.json`
  });
}

async function updateKey(args): Promise<void> {
  const password = await promptly.password(`Enter a passphrase to encrypt your key to disk:`, { replace: `*` });
  const confirm = await promptly.password(`Repeat the passphrase:`, { replace: `*` });

  if (password.length < 8) {
    console.error(`ERROR: password must be at least 8 characters`);
    return;
  }

  if (password !== confirm) {
    console.error(`ERROR: passphrases don't matchPassword confirm failed`);
    return;
  }

  const mnemonic = await promptly.prompt(`Enter your bip39 mnemonic: `);

  if (mnemonic.trim().split(` `).length !== 24) {
    console.error(`Error: Mnemonic is not valid.`);
    return;
  }

  await keystore.importKey(args.keystore, password, mnemonic);
  console.info(`saved!`);
}

async function queryAccount({ lcdAddress, voter }) {
  const url = util.format(lcdAddress + ENDPOINT_QUERY_ACCOUNT, voter.terraAddress);
  console.info(`querying: ${url}`);

  const res = await ax.get(url).catch(e => {
    console.error(`Failed to bringing account number and sequence: ${e.toString()}`);
    return;
  });

  if (!res || res.status !== 200) {
    if (res) console.error(`Failed to bringing account number and sequence: ${res.statusText}`);
    return;
  }

  return res.data.value;
}

async function queryOracleParams({ lcdAddress }) {
  const { data } = await ax.get(`${lcdAddress}/oracle/params`);
  return data;
}

async function queryLatestBlock({ lcdAddress }) {
  const res = await ax.get(lcdAddress + ENDPOINT_QUERY_LATEST_BLOCK);
  if (res) return res.data;
}

async function queryTx({ lcdAddress, txhash }) {
  const res = await ax.get(util.format(lcdAddress + ENDPOINT_QUERY_TX, txhash)).catch(err => {
    if (err.response.status !== 404) {
      console.error(err.response.status, err.response.statusText);
    }
  });

  if (res) return res.data;
}

async function waitTx({ lcdAddress, txhash }) {
  for (let t = 0; t < secTimeout; t += 1) {
    await Bluebird.delay(1000);
    const txQueryData = await queryTx({ lcdAddress, txhash });
    if (txQueryData) return txQueryData;
  }
}

async function broadcast({ lcdAddress, account, broadcastReq }) {
  // Broadcast
  const { data } = await ax.post(lcdAddress + ENDPOINT_TX_BROADCAST, broadcastReq);
  return data;
}

async function getPrice(sources: [string]): Promise<{}> {
  console.info(`getting price data from`, sources);

  const total = {};
  const results = await Bluebird.some(sources.map(s => ax.get(s)), 1);

  if (results.length > 0) {
    const res = results[0];
    const prices = res.data.prices;

    prices.forEach((price): void => {
      if (typeof total[price.currency] !== 'undefined') {
        total[price.currency].push(price.price);
      } else {
        total[price.currency] = [price.price];
      }
    });
  }

  return total;
}

async function vote(args): Promise<void> {
  const { lcdAddress, denoms } = args;
  const source = args.source instanceof Array ? args.source : [args.source];

  let voter;
  let ledgerNode = null;
  let ledgerApp = null;

  if (args.ledgerMode) {
    console.info(`initializing ledger`);
    const ledger = require('./ledger');

    ledgerNode = await ledger.getLedgerNode();
    ledgerApp = await ledger.getLedgerApp(ledgerNode);
    voter = await ledger.getAccountFromLedger(ledgerApp);

    if (voter === null) {
      console.error(`Ledger is not connected or locked`);
      return null;
    }
  } else {
    console.info(`getting key from keystore`);
    const password = args.password || (await promptly.password(`Enter a passphrase:`, { replace: `*` }));
    voter = keystore.getKey(args.keystore, password);
  }

  const [oracleParams, account] = await Promise.all([
    queryOracleParams({ lcdAddress }),
    queryAccount({ lcdAddress, voter })
  ]);

  const oracleVotePeriod = parseInt(oracleParams.vote_period, 10);

  console.info(`Oracle Vote Period: ${oracleVotePeriod}`);

  const denomArray = denoms.split(',').map(s => s.toLowerCase());
  const prevotePrices = {};
  const prevoteSalts = {};
  let prevotePeriod;

  while (true) {
    const startTime = Date.now();

    try {
      const latestBlock = await queryLatestBlock({ ...args });
      const currentBlockHeight = parseInt(latestBlock.block.header.height, 10);
      const votePeriod = Math.floor(currentBlockHeight / oracleVotePeriod);
      const indexInVotePeriod = currentBlockHeight % oracleVotePeriod;

      if (indexInVotePeriod >= oracleVotePeriod - 3 || (prevotePeriod && prevotePeriod === votePeriod)) {
        throw 'skip';
      }

      const voteMsgs = [];
      const prevoteMsgs = [];
      const prices = await getPrice(source);
      const account = await queryAccount({ lcdAddress, voter });

      if (prevotePeriod && votePeriod - prevotePeriod === 1) {
        // Vote
        Object.keys(prices).forEach(currency => {
          if (denomArray.indexOf(currency.toLowerCase()) === -1) {
            return;
          }

          const valAddrs = args.validator || [voter.terraValAddress];
          const denom = `u${currency.toLowerCase()}`;

          console.info(`vote! ${denom} ${prices[currency]} ${valAddrs}`);

          valAddrs.forEach(valAddr => {
            voteMsgs.push(
              msg.generateVoteMsg(
                prevotePrices[currency].toString(),
                prevoteSalts[currency],
                denom,
                voter.terraAddress,
                valAddr
              )
            );
          });
        });
      }

      const priceUpdateMap = {};
      const priceUpdateSaltMap = {};
      // Prevote
      Object.keys(prices).forEach(currency => {
        if (denomArray.indexOf(currency.toLowerCase()) === -1) {
          return;
        }

        priceUpdateSaltMap[currency] = CryptoJS.SHA256((Math.random() * 1000).toString())
          .toString()
          .substring(0, 4);

        const valAddrs = args.validator || [voter.terraValAddress];
        const denom = `u${currency.toLowerCase()}`;

        console.info(`prevote! ${denom} ${prices[currency]} ${valAddrs}`);

        valAddrs.forEach(valAddr => {
          const hash = msg.generateVoteHash(priceUpdateSaltMap[currency], prices[currency].toString(), denom, valAddr);

          prevoteMsgs.push(msg.generatePrevoteMsg(hash, denom, voter.terraAddress, valAddr));
        });

        priceUpdateMap[currency] = prices[currency];
      });

      const msgs = [...voteMsgs, ...prevoteMsgs];
      if (msgs.length > 0) {
        const fees = { amount: [{ amount: `1200`, denom: `ukrw` }], gas: `80000` };
        const { value: tx } = msg.generateStdTx(msgs, fees, `Voting from terra feeder`);
        const signature = await wallet.sign(ledgerApp, voter, tx, {
          chain_id: args.chainID,
          account_number: account.account_number,
          sequence: account.sequence
        });

        const signedTx = wallet.createSignedTx(tx, signature);
        const broadcastReq = wallet.createBroadcastBody(signedTx, `sync`);

        const data = await broadcast({
          lcdAddress,
          account,
          broadcastReq
        }).catch(err => {
          if (err && err.isAxiosError) {
            console.error('===TX', 'axio error', err.code);
          } else if (err && err.response && err.response.data) {
            console.error('===TX', err.response.data);
          } else {
            console.error('===TX', err);
          }
        });

        // successfully broadcast
        if (data && !data.code) {
          const txhash = data.txhash;
          const txQueryData = await waitTx({ lcdAddress, txhash });
          if (txQueryData && !txQueryData.code) {
            Object.assign(prevotePrices, priceUpdateMap);
            Object.assign(prevoteSalts, priceUpdateSaltMap);
            prevotePeriod = Math.floor(Number(txQueryData.height) / oracleVotePeriod);

            console.info(`txhash: ${txhash}`);
            console.info(`prevotePeriod: ${prevotePeriod}`);
          } else {
            console.error(`Failed to find ${txhash}`);
          }
        } else {
          console.error(`Failed to broadcast`);
        }
      }
    } catch (e) {
      if (e !== 'skip') {
        console.error('Error in loop:', e.toString(), 'restart immediately');
        continue;
      }
    }

    // Sleep 5s at least
    await Bluebird.delay(Math.max(5000, 6000 - (Date.now() - startTime)));
  }

  if (ledgerNode !== null) {
    ledgerNode.close_async();
  }
}

async function main(): Promise<void> {
  const parser = new ArgumentParser({
    version: `0.2.0`,
    addHelp: true,
    description: `Terra oracle voter`
  });

  registerCommands(parser);
  const args = parser.parseArgs();

  if (args.subparser_name === `vote`) {
    await vote(args);
  } else if (args.subparser_name === `update-key`) {
    await updateKey(args);
  }
}

main().catch(e => {
  console.error(e);
});
