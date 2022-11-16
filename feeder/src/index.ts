import { ArgumentParser } from 'argparse'
import { VoteService } from './VoteService'
import * as packageInfo from '../package.json'
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as promptly from 'promptly'
import { PlainEntity, VoteServiceConfig } from './models'
import * as ks from './keystore'
import Bluebird from 'bluebird'
dotenv.config()

function registerCommands(parser: ArgumentParser): void {
  const subparsers = parser.addSubparsers({
    title: `command`,
    dest: `command`,
    description: `Available commands`,
  })

  // Voting command
  const voteCommand = subparsers.addParser(`vote`, {
    addHelp: true,
    description: `Fetch price and broadcast oracle messages`,
  })

  voteCommand.addArgument([`-p`, `--password`], {
    action: `store`,
    help: `voter password`,
  })

  voteCommand.addArgument([`-k`, `--key-path`, `--keystore`], {
    action: `store`,
    help: `key store path to save encrypted key`,
    dest: `keyPath`,
    defaultValue: `voter.json`
  })

  voteCommand.addArgument([`-n`, `--key-name`], {
    help: `key name from store`,
    dest: `keyName`,
    defaultValue: `defaultName`
  })

  // Updating Key command
  const keyCommand = subparsers.addParser(`add-key`, {
    addHelp: true,
    description: `Adds a new key in the keystore path`,
  })

  keyCommand.addArgument([`-k`, `--key-path`], {
    help: `key store path to save encrypted key`,
    dest: `keyPath`,
    defaultValue: `voter.json`
  })

  keyCommand.addArgument([`-n`, `--key-name`], {
    help: `key name from store`,
    dest: `keyName`,
    defaultValue: `defaultName`
  })
}

async function main(): Promise<void> {
  const parser = new ArgumentParser({
    version: packageInfo.version,
    addHelp: true,
    description: `Andromeda oracle voter`,
  })

  registerCommands(parser)
  const args = parser.parseArgs()

  if (args.command === `vote`) {
    if (!process.env.VALIDATORS) throw Error("Specify VALIDATORS list in .env file")

    const voteServiceConfig: VoteServiceConfig = {
      lcdUrl: process.env.LCD_URL ?? "http://localhost:1317",
      rpcUrl: process.env.RPC_URL ?? "http://localhost:26657",
      dataSourceUrls: process.env.DATA_SOURCE_URL?.split(",") ?? ["http://localhost:8532/latest"],
      chainID: process.env.CHAIN_ID ?? "andromeda-oracle-1",
      validators: process.env.VALIDATORS.split(","),
      addrPrefix: process.env.ADDR_PREFIX ?? 'adr',
      password: process.env.PASSWORD ?? "thispassword",
      keyPath: process.env.KEY_PATH ?? args.keyPath,
      keyName: process.env.KEY_NAME ?? args.keyName,

    };

    const plainEntry: PlainEntity = ks.load(
      voteServiceConfig.keyPath,
      voteServiceConfig.keyName,
      voteServiceConfig.password
    );
    const voteService = await VoteService.getNewService(voteServiceConfig, plainEntry);

    while (true) {
      const startTime = Date.now()

      await voteService.process()
        .catch(err => {
          console.error(JSON.stringify(err));

          if (err.isAxiosError) {
            // TODO: switch price client if axios error at some point
            console.info('vote: lcd client unavailable, rotating to next lcd client.')
          }
          voteService.resetPrevote()
        })
      await Bluebird.delay(Math.max(500, 500 - (Date.now() - startTime)))
    }
  }
  else if (args.command === `add-key`) {
    let password = process.env.PASSWORD || ''
    let mnemonic = process.env.MNEMONIC || ''

    if (password === '') {
      password = await promptly.password(`Enter a password to encrypt your key to disk:`, {
        replace: `*`,
      })
      const confirm = await promptly.password(`Repeat the password:`, { replace: `*` })

      if (password !== confirm) {
        console.error(`ERROR: passwords don't match, retry`)
        return
      }
    }

    if (password.length < 8) {
      console.error(`ERROR: password must be at least 8 characters`)
      return
    }

    if (mnemonic === '') {
      mnemonic = await promptly.prompt(`Enter your bip39 mnemonic: `)
    }

    if (mnemonic.trim().split(` `).length !== 24) {
      console.error(`Error: Mnemonic is not valid.`)
      return
    }

    await ks.save(args.keyPath, 'voter', password, mnemonic)
    console.info(`saved!`)
  }
  else throw Error("Missing argument, it has to be vote or add-key")
}

main().catch((e) => {
  console.error(e)
})
