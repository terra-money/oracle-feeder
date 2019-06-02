import * as Bluebird from 'bluebird';
import axios from 'axios';
import * as util from 'util';
import * as promptly from 'promptly';
import { ArgumentParser } from 'argparse';

import * as wallet from './wallet';
import * as keystore from './keystore';

const endpointVote = `/oracle/denoms/%s/votes`;
const endpointAccount = `/auth/accounts/%s`;
const endpointBroadcast = `/txs`;

function registCommands(parser: ArgumentParser): void {
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

async function votePrice(
  { lcdAddress, chainID },
  ledger,
  currency: string,
  price: string,
  voter,
  account: { account_number: string; sequence: string }
): Promise<void> {
  /* eslint-disable @typescript-eslint/camelcase */
  const txArgs = {
    base_req: {
      from: voter.terraAddress,
      memo: `Voting from terra feeder`,
      chain_id: chainID,
      account_number: account.account_number,
      sequence: account.sequence,
      fees: [{ amount: `0`, denom: `uluna` }],
      gas: `50000`,
      gas_adjustment: `0`,
      simulate: false
    },
    price
  };

  const denom = `u${currency.toLowerCase()}`;
  const url = util.format(lcdAddress + endpointVote, denom);

  // Create unsinged tx for voting
  let res = await axios.post(url, txArgs).catch(e => {
    throw e;
  });

  const tx = res.data.value;

  // Sign
  const signature = await wallet.sign(ledger, voter, tx, txArgs.base_req);
  const signedTx = wallet.createSignedTx(tx, signature);
  const boradcastReq = wallet.createBroadcastBody(signedTx, `sync`);

  // Send broadcast
  res = await axios.post(lcdAddress + endpointBroadcast, boradcastReq).catch(e => {
    throw e;
  });

  if (res.data.code !== undefined) {
    console.error('voting failed:', JSON.stringify(res.statusText));
  } else {
    console.log(`Voted: ${denom} = ${price}, txhash: ${res.data.txhash}`);
  }
}

async function getPrice(sources: [string]): Promise<{}> {
  const total = {};
  const res = await Bluebird.some(sources.map(s => axios.get(s)), 1);

  if (res.status === 200) {
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

async function updateAndVoting(args): Promise<void> {
  const { lcdAddress, denoms } = args;
  const source = args.source instanceof Array ? args.source : [args.source];

  console.info(`getting price data from`, source);
  const prices = await getPrice(source);
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

  const query = util.format(lcdAddress + endpointAccount, voter.terraAddress);
  console.info(`query account number and sequence: ${query}`);

  const res = await axios.get(query).catch(e => {
    console.error(`Failed to bringing account number and sequence : ${e.toString()}`);
    return;
  });

  if (!res) {
    return;
  }

  if (res.status !== 200) {
    console.error(`Failed to bringing account number and sequence : ${res.statusText}`);
    return;
  }

  const account = res.data.value;
  const lowerDenoms = denoms.toLowerCase();

  console.info(`votting denoms`);

  for (const currency in prices) {
    if (lowerDenoms !== 'all' && lowerDenoms.indexOf(currency.toLowerCase()) === -1) {
      continue;
    }

    try {
      await votePrice(args, ledgerApp, currency, prices[currency].toString(), voter, account);
      account.sequence = (parseInt(account.sequence, 10) + 1).toString();
    } catch (e) {
      console.error(e.toString());
    }
  }

  if (ledgerNode !== null) {
    ledgerNode.close_async();
  }
}

async function main(): Promise<void> {
  const parser = new ArgumentParser({
    version: `0.1.0`,
    addHelp: true,
    description: `Terra oracle voter`
  });

  registCommands(parser);
  const args = parser.parseArgs();

  if (args.subparser_name === `vote`) {
    await updateAndVoting(args);
  } else if (args.subparser_name === `update-key`) {
    await updateKey(args);
  }
}

main().catch(e => {
  console.error(e);
});
