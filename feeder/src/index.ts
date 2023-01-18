import { ArgumentParser } from 'argparse'
import { vote } from './vote'
import { addKey } from './addKey'
import * as packageInfo from '../package.json'
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

function registerCommands(parser: ArgumentParser): void {
  const subparsers = parser.addSubparsers({
    title: `commands`,
    dest: `subparser_name`,
    description: `Available commands`,
  })

  // Voting command
  const voteCommand = subparsers.addParser(`vote`, {
    addHelp: true,
    description: `Fetch price and broadcast oracle messages`,
  })

  voteCommand.addArgument(['-l', '--lcd-url'], {
    action: 'append',
    help: 'lcd address',
    dest: 'lcdUrl',
    required: false,
  })

  voteCommand.addArgument([`-c`, `--chain-id`], {
    action: `store`,
    help: `chain ID`,
    dest: `chainID`,
    required: false,
  })

  voteCommand.addArgument([`--validators`], {
    action: `append`,
    help: `validators address (e.g. terravaloper1...), can have multiple`,
    required: false,
  })

  voteCommand.addArgument([`-d`, `--data-source-url`], {
    action: `append`,
    help: `Append price data source(It can handle multiple sources)`,
    dest: `dataSourceUrl`,
    required: false,
  })

  voteCommand.addArgument([`-p`, `--password`], {
    action: `store`,
    help: `voter password`,
  })

  voteCommand.addArgument([`-k`, `--key-path`, `--keystore`], {
    action: `store`,
    help: `key store path to save encrypted key`,
    dest: `keyPath`,
    required: false,
  })

  voteCommand.addArgument([`-n`, `--key-name`], {
    help: `name assigned to the generated key`,
    dest: `keyName`,
    defaultValue: `voter`,
  })

  // Updating Key command
  const keyCommand = subparsers.addParser(`add-key`, { addHelp: true })

  keyCommand.addArgument([`-n`, `--key-name`], {
    help: `name to assigns to the generated key`,
    dest: `keyName`,
    defaultValue: `voter`,
  })

  keyCommand.addArgument([`-t`, `--coin-type`], {
    help: `coin type used to derive the public address (https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#path-levels)`,
    dest: `coinType`,
    defaultValue: `118`,
  })

  keyCommand.addArgument([`-k`, `--key-path`], {
    help: `key store path to save encrypted key`,
    dest: `keyPath`,
    defaultValue: `voter.json`,
  })
}

async function main(): Promise<void> {
  const parser = new ArgumentParser({
    version: packageInfo.version,
    addHelp: true,
    description: `Terra oracle voter`,
  })

  registerCommands(parser)
  const args = parser.parseArgs()

  args.prefix = process.env.ADDR_PREFIX

  if (args.subparser_name === `vote`) {
    args.lcdUrl = args.lcdUrl || (process.env.LCD_URL && process.env.LCD_URL.split(',')) || []

    args.dataSourceUrl =
      args.dataSourceUrl || (process.env.DATA_SOURCE_URL && process.env.DATA_SOURCE_URL.split(',')) || []
    args.chainID = args.chainID || process.env.CHAIN_ID || 'candled-testnet-1'
    if (args.lcdUrl?.length === 0 || args.dataSourceUrl?.length === 0 || args.chainID === '') {
      console.error('Missing --lcd, --chain-id or --data-source-url')
      return
    }

    args.keyPath = args.keyPath || process.env.KEY_PATH || 'voter.json'
    args.password = args.password || process.env.PASSWORD || ''
    if (args.keyPath === '' || args.password === '') {
      console.error('Missing either --key-path or --password')
      return
    }

    // validators is skippable and default value will be extracted from the key
    args.validators = args.validators || (process.env.VALIDATORS && process.env.VALIDATORS.split(','))

    args.keyName = process.env.KEY_NAME ? process.env.KEY_NAME : args.keyName

    await vote(args)
  } else if (args.subparser_name === `add-key`) {
    await addKey(args.keyPath, args.coinType, args.keyName, args.prefix)
  }
}

main().catch((e) => {
  console.error(e)
})
