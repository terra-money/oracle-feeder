import { ArgumentParser } from 'argparse'
import { vote } from './vote'
import { addKey } from './addKey'
import * as packageInfo from '../package.json'
import * as promptly from 'promptly'
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

function registerCommands(parser: ArgumentParser): void {
  const subparsers = parser.addSubparsers({
    title: 'commands',
    dest: 'subparser_name',
    description: 'Available commands',
  })

  // Voting command
  const voteCommand = subparsers.addParser('vote', {
    addHelp: true,
    description: 'Fetch price and broadcast oracle messages',
  })

  voteCommand.addArgument(['-l', '--lcd-url'], {
    help: 'lcd url address (default: process.env.LCD_URL or ["http://localhost:1317"])',
    action: 'append',
    dest: 'lcdUrl',
    defaultValue: (process.env.LCD_URL && process.env.LCD_URL.split(',')) || ['http://localhost:1317'],
    required: false,
  })

  voteCommand.addArgument(['-c', '--chain-id'], {
    help: 'chain id where the vote transactions must be submitted to (default: process.env.CHAIN_ID or "candle-1")',
    action: 'store',
    dest: 'chainID',
    defaultValue: process.env.CHAIN_ID || 'candle-1',
    required: false,
  })

  voteCommand.addArgument(['--validators'], {
    help: 'validators address(es) (e.g. terravaloper1...)',
    action: 'append',
    required: false,
    defaultValue: process.env.VALIDATORS && process.env.VALIDATORS.split(','),
  })

  voteCommand.addArgument(['-d', '--data-source-url'], {
    help: 'Append price(s) data source (default: process.env.DATA_SOURCE_URL or ["http://localhost:8532/latest"])',
    action: 'append',
    dest: 'dataSourceUrl',
    defaultValue: (process.env.DATA_SOURCE_URL && process.env.DATA_SOURCE_URL.split(',')) || [
      'http://localhost:8532/latest',
    ],
    required: false,
  })

  voteCommand.addArgument(['-p', '--password'], {
    help: 'key store voter password (default: process.env.PASSWORD)',
    action: 'store',
    defaultValue: process.env.PASSWORD,
  })

  voteCommand.addArgument(['-k', '--key-path', '--keystore'], {
    help: 'key store path where to save encrypted key (default: process.env.KEY_PATH or "voter.json")',
    action: 'store',
    dest: 'keyPath',
    defaultValue: process.env.KEY_PATH || 'voter.json',
  })

  voteCommand.addArgument(['-n', '--key-name'], {
    help: 'name to assing to the generated key inside the keystore (default: process.env.KEY_NAME or "voter")',
    dest: 'keyName',
    defaultValue: process.env.KEY_NAME || 'voter',
  })

  voteCommand.addArgument(['-a', '--address-prefix'], {
    help: 'prefix for the addresses to be generated (default: process.env.ADDR_PREFIX or "candle")',
    dest: 'prefix',
    defaultValue: process.env.ADDR_PREFIX || 'candle',
  })

  voteCommand.addArgument(['-v', '--voter'], {
    help: 'addresses of the wallet to vote on behalf (default: process.env.VOTER or default stored address from keystore)',
    dest: 'voter',
    defaultValue: process.env.VOTER,
  })

  // Updating Key command
  const addKeyCommand = subparsers.addParser('add-key', { addHelp: true })
  addKeyCommand.addArgument(['-n', '--key-name'], {
    help: 'name to assing to the generated key inside the keystore (default: process.env.KEY_NAME or "voter")',
    dest: 'keyName',
    defaultValue: process.env.KEY_NAME || 'voter',
  })
  addKeyCommand.addArgument(['-t', '--coin-type'], {
    help: 'coin type used to derive the public address (default: process.env.COIN_TYPE or "118")',
    dest: 'coinType',
    defaultValue: process.env.COIN_TYPE || '118',
  })
  addKeyCommand.addArgument(['-k', '--key-path'], {
    help: 'key store path where to save encrypted key (default: process.env.KEY_PATH or "voter.json")',
    dest: 'keyPath',
    defaultValue: process.env.KEY_PATH || 'voter.json',
  })
  addKeyCommand.addArgument(['-a', '--address-prefix'], {
    help: 'prefix for the addresses to be generated (default: process.env.ADDR_PREFIX or "candle")',
    dest: 'prefix',
    defaultValue: process.env.ADDR_PREFIX || 'candle',
  })
}

async function main(): Promise<void> {
  const parser = new ArgumentParser({
    version: packageInfo.version,
    addHelp: true,
    description: 'Terra oracle voter',
  })

  registerCommands(parser)
  const args = parser.parseArgs()

  console.log(args)

  if (args.subparser_name === 'vote') {
    args.password = args.password || (await promptly.password(`Enter a passphrase:`, { replace: `*` }))

    await vote(args)
  } else if (args.subparser_name === 'add-key') await addKey(args)
}

main().catch((e) => {
  console.error(e)
})
