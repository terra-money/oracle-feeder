import { ArgumentParser } from 'argparse'
import { vote } from './vote'
import { updateKey } from './updateKey'
import * as packageInfo from '../package.json'

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

  voteCommand.addArgument([`--ledger`], {
    action: `storeTrue`,
    help: `using ledger`,
    dest: 'ledgerMode',
    defaultValue: false,
  })

  voteCommand.addArgument(['-l', '--lcd'], {
    action: 'append',
    help: 'lcd address',
    dest: 'lcdAddress',
    required: false,
  })

  voteCommand.addArgument([`-c`, `--chain-id`], {
    action: `store`,
    help: `chain ID`,
    dest: `chainID`,
    required: false,
  })

  voteCommand.addArgument([`--validator`], {
    action: `append`,
    help: `validator address (e.g. terravaloper1...), can have multiple`,
    required: false,
  })

  voteCommand.addArgument([`-s`, `--source`], {
    action: `append`,
    help: `Append price data source(It can handle multiple sources)`,
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

  voteCommand.addArgument([`-d`, `--denoms`], {
    action: `help`,
    help: '🚨***DEPRECATED***🚨 remove this parameter from command line',
  })

  // Updating Key command
  const keyCommand = subparsers.addParser(`update-key`, { addHelp: true })

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

  if (args.subparser_name === `vote`) {
    args.lcdAddress =
      args.lcdAddress || (process.env['LCD_ADDRESS'] && process.env['LCD_ADDRESS'].split(',')) || []
    args.source = args.source || (process.env['SOURCE'] && process.env['SOURCE'].split(',')) || []
    args.chainID = args.chainID || process.env['CHAIN_ID'] || ''
    if (args.lcdAddress.length === 0 || args.source.length === 0 || args.chainID === '') {
      console.error('Missing --lcd, --chain-id or --source')
      return
    }

    args.keyPath = args.keyPath || process.env['KEY_PATH'] || 'voter.json'
    args.password = args.password || process.env['PASSPHRASE'] || ''
    if (args.keyPath === '' || args.passphrase === '') {
      console.error('Missing either --key-path or --password')
      return
    }

    // validator is skippable and default value will be extracted from the key
    args.validator =
      args.validator || (process.env['VALIDATOR'] && process.env['VALIDATOR'].split(','))

    await vote(args)
  } else if (args.subparser_name === `update-key`) {
    await updateKey(args.keyPath)
  }
}

main().catch((e) => {
  console.error(e)
})
