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
    description: `Fetch price from the price-server and broadcast oracle messages to the LCD clients specified.`,
  })

  // !-------------------------------------[TODO:  could use a better description  ]-----------------------------------------#
  voteCommand.addArgument([`--ledger`], {
    action: `storeTrue`,
    help: `using ledger`,
    dest: 'ledgerMode',
    defaultValue: false,
  })

  voteCommand.addArgument(['-l', '--lcd'], {
    action: 'append',
    help: 'Specify a running Lite Client Daemon (LCD) address.',
    dest: 'lcdAddresses',
    required: false,
  })

  voteCommand.addArgument(['-L', '--lcdL'], {
    action: 'append',
    help:
      'Specify a running Lite Client Daemon (LCD) leader address.' +
      'This will be maintained as the default LCD and frequently polled for liveness in terms of failure with intent to return to it.' +
      'More than one leader is possible and the precedence between them is the same as the order of their --lcdL arguments, they will polled accordingly.',
    dest: 'lcdAddressesLeaders',
    required: false,
  })

  // !-------------------------------------[TODO:  could use a better description, example, a link to terra docs  ]-----------------------------------------#
  voteCommand.addArgument([`-c`, `--chain-id`], {
    action: `store`,
    help: `chain ID`,
    dest: `chainID`,
    required: false,
  })

  // !-------------------------------------[TODO:  could use a better description,example, a link to terra docs  ]-----------------------------------------#
  voteCommand.addArgument([`--validator`], {
    action: `append`,
    help: `validator address (e.g. terravaloper1...), can have multiple`,
    required: false,
  })

  voteCommand.addArgument([`-s`, `--source`], {
    action: `append`,
    help: `Append price data source (It can handle multiple sources)`,
    dest: `sources`,
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

  voteCommand.addArgument([`-V`, `--verbose`], {
    action: `storeTrue`,
    help: `Enable verbose logging.`,
    dest: `verbose`,
    required: false,
  })
  // voteCommand.addArgument([`-d`, `--denoms`], {
  //   action: `help`,
  //   help  : '🚨***DEPRECATED***🚨 remove this parameter from command line',
  // })

  // Updating Key command
  const keyCommand = subparsers.addParser(`update-key`, { addHelp: true })

  keyCommand.addArgument([`-k`, `--key-path`], {
    help: `key store path to save encrypted key`,
    dest: `keyPath`,
    defaultValue: `voter.json`,
  })
}

export interface CLIArgs {
  subparser_name      : 'vote' | 'update-key'
  verbose ?           : boolean
  keyPath?            : string
  password            : string
  sources?            : string[]
  validators?         : string[]
  chainID?            : string
  lcdAddressesLeaders?: string[]
  lcdAddresses?       : string[]
  ledgerMode?         : boolean
  
}

async function main(): Promise<void> {
  const parser = new ArgumentParser({
    version    : packageInfo.version,
    addHelp    : true,
    description: `Terra oracle voter`,
  })

  registerCommands(parser)
  const args :CLIArgs  = parser.parseArgs()

  if (args.subparser_name === `vote`) {
    console.log(args)

    // ? LCD Addresses, prices source, chainId
    args.lcdAddresses        = args.lcdAddresses        ||(process.env['LCD_ADDRESS'       ] && process.env['LCD_ADDRESS'       ].split(',')) ||[]
    console.log("Before ARGS," , args.lcdAddressesLeaders);
    args.lcdAddressesLeaders = args.lcdAddressesLeaders ||(process.env['LCD_ADDRESS_LEADER'] && process.env['LCD_ADDRESS_LEADER'].split(',')) ||[]
    console.log("AFTER ARGS," , args.lcdAddressesLeaders);
    

    args.sources             = args.sources || (process.env['SOURCE'] && process.env['SOURCE'].split(',')) || []
    args.chainID             = args.chainID || process.env['CHAIN_ID'] || ''

    if ([...args.lcdAddresses, ...args.lcdAddressesLeaders].length === 0) {
      console.error(
        'Specify at least one valid LCD with --lcd [LCD_ADDRESS] or --lcdL [PRIORITY_LCD_ADDRESS]'
      )
      return
    } else if (args.sources.length === 0) {
      console.error('No price sources are specified. Provide at least one source with -s/--source [SERVER]')
      return
    } else if (args.chainID === '') {
      console.error('Provide the Id of the chain to validate with -c/--chain-id [CHAIN]')
      return
    }

    // ? Auth Details
    args.keyPath = args.keyPath || process.env['KEY_PATH'] || 'voter.json'
    args.password = args.password || process.env['PASSPHRASE'] || ''
    if (args.keyPath === '' || args.password === '') {
      console.error('Missing either --key-path or --password')
      return
    }

    // Validator is skippable and default value will be extracted from the key
    args.validators = args.validators ||  process.env['VALIDATOR']  && process.env['VALIDATOR'].split(',') || []


    if (args.verbose) {
      process.env.VERBOSE = '1'
    }
    var {
      chainID,
      keyPath, 
      lcdAddresses,
      lcdAddressesLeaders,
      password,
      sources,
      validators
    }  = args

    await vote({
      chainID,
      keyPath, 
      lcdAddresses,
      lcdAddressesLeaders,
      password,
      sources,
      validators
    })

  } else if (args.subparser_name === `update-key`) {
    args.keyPath && await updateKey(args.keyPath)
  }
}

main().catch((e) => {
  console.error(e)
})
