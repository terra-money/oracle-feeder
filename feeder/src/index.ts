import { ArgumentParser } from 'argparse'
import { vote } from './vote'
import { updateKey } from './updateKey'

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
    action: 'store',
    help: 'lcd address',
    dest: 'lcdAddress',
    required: true,
  })

  voteCommand.addArgument([`-c`, `--chain-id`], {
    action: `store`,
    help: `chain ID`,
    dest: `chainID`,
    required: true,
  })

  voteCommand.addArgument([`--validator`], {
    action: `append`,
    help: `validator address (e.g. terravaloper1...), can have multiple`,
    required: false,
  })

  voteCommand.addArgument([`-s`, `--source`], {
    action: `append`,
    help: `Append price data source(It can handle multiple sources)`,
    required: true,
  })

  voteCommand.addArgument([`-p`, `--password`], {
    action: `store`,
    help: `voter password`,
  })

  voteCommand.addArgument([`-k`, `--key-path`, `--keystore`], {
    action: `store`,
    help: `key store path to save encrypted key`,
    dest: `keyPath`,
    defaultValue: `voter.json`,
  })

  voteCommand.addArgument([`-g`, `--gas-prices`], {
    action: `store`,
    help: `gas prices (default 169.77ukrw)`,
    dest: `gasPrices`,
    defaultValue: `169.77ukrw`,
  })

  voteCommand.addArgument([`-d`, `--denoms`], {
    action: `help`,
    help: '🚨***DEPRECATED***🚨 remove this parameter from command line',
  })

  // Updating Key command
  const keyCommand = subparsers.addParser(`update-key`, { addHelp: true })

  keyCommand.addArgument([`-k`, `--keypath`], {
    help: `key store path to save encrypted key`,
    dest: `keyPath`,
    defaultValue: `voter.json`,
  })
}

async function main(): Promise<void> {
  const parser = new ArgumentParser({
    version: `0.2.0`,
    addHelp: true,
    description: `Terra oracle voter`,
  })

  registerCommands(parser)
  const args = parser.parseArgs()

  if (args.subparser_name === `vote`) {
    await vote(args)
  } else if (args.subparser_name === `update-key`) {
    await updateKey(args.keyPath)
  }
}

main().catch((e) => {
  console.error(e)
})
