import * as Bluebird from 'bluebird';
import axios from 'axios';
import * as util from 'util';
import * as promptly from 'promptly';
import { ArgumentParser } from 'argparse';
import delay from 'delay';

import * as wallet from './wallet';
import * as keystore from './keystore';

const ENDPOINT_TX_PREVOTE = `/oracle/denoms/%s/prevotes`;
const ENDPOINT_TX_VOTE = `/oracle/denoms/%s/votes`;
const ENDPOINT_TX_BROADCAST = `/txs`;
const ENDPOINT_QUERY_LATEST_BLOCK = `/blocks/latest`;
const ENDPOINT_QUERY_ACCOUNT = `/auth/accounts/%s`;
const ENDPOINT_QUERY_PREVOTE = `/oracle/denoms/%s/prevotes/%s`;
const VOTE_PERIOD = 6;

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
    action: `store`,
    help: `validator address (e.g. terravaloper1...)`,
    required: true
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
  console.log(`saved!`);
}

async function queryAccount({ lcdAddress, voter }) {
  const url = util.format(lcdAddress + ENDPOINT_QUERY_ACCOUNT, voter.terraAddress);
  console.info(`querying: ${url}`);

  const res = await axios.get(url).catch(e => {
    console.error(`Failed to bringing account number and sequence: ${e.toString()}`);
    return;
  });

  if (!res || res.status !== 200) {
    if (res) console.error(`Failed to bringing account number and sequence: ${res.statusText}`);
    return;
  }

  return res.data.value;
}

async function queryLatestBlock({ lcdAddress }) {
  const res = await axios.get(lcdAddress + ENDPOINT_QUERY_LATEST_BLOCK);
  if (res) return res.data;
}

async function queryPrevote({ lcdAddress, currency, validator }) {
  const denom = `u${currency.toLowerCase()}`;
  const url = util.format(lcdAddress + ENDPOINT_QUERY_PREVOTE, denom, validator);

  const res = await axios.get(url);

  if (res.status === 200) {
    return res.data[0];
  }
}

async function txVote({
  lcdAddress,
  chainID,
  validator,
  ledgerApp,
  voter,
  currency,
  price,
  salt,
  account,
  isPrevote = false,
  broadcastMode = 'sync'
}): Promise<number> {
  /* eslint-disable @typescript-eslint/camelcase */
  const txArgs = {
    base_req: {
      from: voter.terraAddress,
      memo: `Voting from terra feeder`,
      chain_id: chainID,
      account_number: account.account_number,
      sequence: account.sequence,
      fees: [{ amount: `450`, denom: `uluna` }],
      gas: `30000`,
      gas_adjustment: `0`,
      simulate: false
    },
    price,
    salt,
    validator
  };

  const denom = `u${currency.toLowerCase()}`;
  const url = util.format(lcdAddress + (isPrevote ? ENDPOINT_TX_PREVOTE : ENDPOINT_TX_VOTE), denom);

  // Create unsinged tx for voting
  const {
    data: { value: tx }
  } = await axios.post(url, txArgs).catch(e => {
    console.error(e.response.data.error);
    throw e;
  });

  // Sign
  const signature = await wallet.sign(ledgerApp, voter, tx, txArgs.base_req);
  const signedTx = wallet.createSignedTx(tx, signature);
  const broadcastReq = wallet.createBroadcastBody(signedTx, broadcastMode);

  // Send broadcast
  const { data } = await axios.post(lcdAddress + ENDPOINT_TX_BROADCAST, broadcastReq).catch(e => {
    console.error(e.response.data.error);
    throw e;
  });

  if (data.code !== undefined) {
    console.error('voting failed:', data.logs);
    return 0;
  }

  if (data.logs && !data.logs[0].success) {
    console.error('voting tx sent, but failed:', data.logs);
  } else {
    console.log(`${denom} = ${price}, txhash: ${data.txhash}`);
  }

  account.sequence = (parseInt(account.sequence, 10) + 1).toString();
  return +data.height;
}

async function getPrice(sources: [string]): Promise<{}> {
  console.info(`getting price data from`, sources);

  const total = {};
  const results = await Bluebird.some(sources.map(s => axios.get(s)), 1);

  if (results.length > 0) {
    const res = results[0];
    const prices = res.data.prices;

    prices.forEach(
      (price): void => {
        if (typeof total[price.currency] !== 'undefined') {
          total[price.currency].push(price.price);
        } else {
          total[price.currency] = [price.price];
        }
      }
    );
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

  const denomArray = denoms.split(',').map(s => s.toLowerCase());
  const prevotePrices = {};
  const prevotePeriods = {};

  while (1) {
    const startTime = Date.now();

    try {
      const prices = await getPrice(source);
      const latestBlock = await queryLatestBlock({ ...args });
      const currentBlockHeight = parseInt(latestBlock.block.header.height, 10);
      const votePeriod = Math.floor(currentBlockHeight / VOTE_PERIOD);

      const account = await queryAccount({ lcdAddress, voter });

      // Vote
      await Bluebird.mapSeries(Object.keys(prices), async currency => {
        if (denomArray.indexOf(currency.toLowerCase()) === -1) {
          return;
        }

        if (!prevotePeriods[currency]) {
          return;
        }

        if (votePeriod !== prevotePeriods[currency]) {
          console.log(`vote! ${currency} ${prevotePrices[currency]}`);

          await txVote({
            ...args,
            ledgerApp,
            voter,
            currency,
            price: prevotePrices[currency].toString(),
            account,
            broadcastMode: `sync`
          }).catch(console.error);

          prevotePeriods[currency] = votePeriod;
        }
      });

      if (currentBlockHeight % VOTE_PERIOD <= 3) {
        // Prevote
        await Bluebird.mapSeries(Object.keys(prices), async currency => {
          if (denomArray.indexOf(currency.toLowerCase()) === -1) {
            return;
          }

          console.log(`prevote! ${currency} ${prices[currency]}`);

          const height = await txVote({
            ...args,
            ledgerApp,
            voter,
            currency,
            price: prices[currency].toString(),
            account,
            isPrevote: true,
            broadcastMode: `block`
          });

          if (height) {
            prevotePrices[currency] = prices[currency];
            prevotePeriods[currency] = Math.floor(height / VOTE_PERIOD);
          }
        });
      }
    } catch (e) {
      console.error('Error in loop:', e.toString());
    }

    // Sleep 2s at least
    await delay(Math.max(2000, 5000 - (Date.now() - startTime)));
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
