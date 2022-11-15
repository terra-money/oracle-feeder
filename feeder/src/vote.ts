import * as crypto from 'crypto'
import * as Bluebird from 'bluebird'
import * as promptly from 'promptly'
import * as http from 'http'
import * as https from 'https'
import axios from 'axios'
import * as ks from './keystore'
import * as packageInfo from '../package.json'
import { Secp256k1HdWallet, LcdClient, StdFee} from "@cosmjs/launchpad";
import { IgniteClient } from 'oracle/client'
import { Module } from './oracle'
import { OracleAsset, OracleParams } from 'oracle/rest'
import { MsgAggregateExchangeRateVote } from 'oracle/module'

const ax = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout: 10000,
  headers: {
    post: {
      'Content-Type': 'application/json',
    },
  },
})

async function loadOracleParams(igniteClient: IgniteClient, lcd: LcdClient): Promise<{
  oracleVotePeriod: number
  oracleWhitelist: OracleAsset[]
  currentVotePeriod: number
  indexInVotePeriod: number
  nextBlockHeight: number
}> {
  const oracle = Module(igniteClient).module.OracleOracle;
  const oracleParams = (await oracle.query.queryParams()).data.params as OracleParams;
  const oracleVotePeriod = Number(oracleParams.vote_period);
  const oracleWhitelist: OracleAsset[] = oracleParams.whitelist as OracleAsset[];
  const latestBlock = await lcd.blocksLatest();

  // the vote will be included in the next block
  const nextBlockHeight = parseInt(latestBlock.block.header.height, 10) + 1
  const currentVotePeriod = Math.floor(nextBlockHeight / oracleVotePeriod)
  const indexInVotePeriod = nextBlockHeight % oracleVotePeriod

  return {
    oracleVotePeriod,
    oracleWhitelist,
    currentVotePeriod,
    indexInVotePeriod,
    nextBlockHeight,
  }
}

interface Price {
  denom: string
  name: string
  price: string
}

async function getPrices(sources: string[]): Promise<Price[]> {
  console.info(`getPrices: source: ${sources.join(',')}`)

  const results = await Bluebird.some(
    sources.map((s) => ax.get(s)),
    1
  ).then((results) =>
    results.filter(({ data }) => {
      if (
        typeof data.created_at !== 'string' ||
        !Array.isArray(data.prices) ||
        !data.prices.length
      ) {
        console.error('getPrices: invalid response')
        return false
      }

      // Ignore prices older than 60 seconds ago
      if (Date.now() - new Date(data.created_at).getTime() > 60 * 1000) {
        console.error('getPrices: too old')
        return false
      }

      return true
    })
  )

  if (!results.length) {
    return []
  }

  return results[0].data.prices
}

/**
 * prepareOracleAssets traverses prices array for following logics:
 * 1. Removes price that cannot be found in oracle whitelist
 * 2. Fill abstain prices for prices that cannot be found in price source but in oracle whitelist
 */
function prepareOracleAssets(prices: Price[], oracleWhitelisted: OracleAsset[]): OracleAsset[] {
  const newPrices = prices.map((price) => {
      const { denom } = price
      const exists = oracleWhitelisted.findIndex(asset => asset.denom?.indexOf(`u${denom.toLowerCase()}`) === -1);
      
      if (exists === -1) {
        return
      }

      return price
    })
    .filter(Boolean) as OracleAsset[]

  oracleWhitelisted.forEach(asset => {
    const found = prices.filter(price => asset.denom === `u${price.denom.toLowerCase()}`).length > 0

    if (!found) {
      newPrices.push({
        denom: asset.denom?.slice(1).toUpperCase(),
        amount: '0.000000',
      })
    }
  })

  return newPrices
}

function buildVoteMsgs(
  prices: OracleAsset[],
  valAddrs: string[],
  feeder: string
): MsgAggregateExchangeRateVote[] {
  const exchangeRates = prices.map(({ denom, amount }) => `${amount}u${denom?.toLowerCase()}`).join(',')

  return valAddrs.map((validator) => {
    const salt = crypto.randomBytes(2).toString('hex')

    return { exchangeRates,  salt,  feeder,  validator}
  })
}

let previousVoteMsgs: MsgAggregateExchangeRateVote[] = []
let previousVotePeriod = 0

// yarn start vote command
export async function processVote(
  client: IgniteClient,
  lcd: LcdClient,
  priceURLs: string[],
  valAddrs: string[],
  voterAddr: string
): Promise<void> {
  const {
    oracleVotePeriod,
    oracleWhitelist,
    currentVotePeriod,
    indexInVotePeriod,
    nextBlockHeight,
  } = await loadOracleParams(client, lcd)

  // Skip until new voting period
  // Skip when index [0, oracleVotePeriod - 1] is bigger than oracleVotePeriod - 2 or index is 0
  if (
    (previousVotePeriod && currentVotePeriod === previousVotePeriod) ||
    oracleVotePeriod - indexInVotePeriod < 2
  ) {
    return
  }

  // If it failed to reveal the price,
  // reset the state by throwing error
  if (previousVotePeriod && currentVotePeriod - previousVotePeriod !== 1) {
    throw new Error('Failed to Reveal Exchange Rates; reset to prevote')
  }

  // Print timestamp before start
  console.info(`timestamp: ${new Date().toUTCString()}`)

  // Removes non-whitelisted currencies and abstain for not fetched currencies
  const prices = prepareOracleAssets(await getPrices(priceURLs), oracleWhitelist)

  // Build Exchange Rate Vote Msgs
  const voteMsgs: MsgAggregateExchangeRateVote[] = buildVoteMsgs(prices, valAddrs, voterAddr)

  // Build Exchange Rate Prevote Msgs
  const isPrevoteOnlyTx = previousVoteMsgs.length === 0
  const msgs = [
    ...previousVoteMsgs, 
    ...voteMsgs,
  ]

  const txres = await client.signAndBroadcast(msgs,{gas: (1 + msgs.length) * 50000},`${packageInfo.name}@${packageInfo.version}`)
    .catch((e)=> {
      return console.error(`broadcast error: code: ${e.code}, raw_log: ${e.raw_log}`)
    })


  const txhash = txres?.transactionHash;
  console.info(`broadcast success: txhash: ${txhash}`)

  const height = await validateTx(
    lcd,
    nextBlockHeight,
    txhash as string,
    // if only prevote exist, then wait 2 * vote_period blocks,
    // else wait left blocks in the current vote_period
    isPrevoteOnlyTx ? oracleVotePeriod * 2 : oracleVotePeriod - indexInVotePeriod
  )

  // Update last success VotePeriod
  previousVotePeriod = Math.floor(height / oracleVotePeriod)
  previousVoteMsgs = voteMsgs
}

async function validateTx(
  lcd: LcdClient,
  nextBlockHeight: number,
  txhash: string,
  timeoutHeight: number
): Promise<number> {
  let height = 0

  // wait 3 blocks
  const maxBlockHeight = nextBlockHeight + timeoutHeight

  // current block height
  let lastCheckHeight = nextBlockHeight - 1

  while (!height && lastCheckHeight < maxBlockHeight) {
    await Bluebird.delay(1500)

    const lastBlock = await lcd.blocksLatest()
    const latestBlockHeight = parseInt(lastBlock.block.header.height, 10)

    if (latestBlockHeight <= lastCheckHeight) {
      continue
    }

    // set last check height to latest block height
    lastCheckHeight = latestBlockHeight

    // wait for indexing (not sure; but just for safety)
    await Bluebird.delay(500)

    await client.tx
      .txInfo(txhash)
      .then((txinfo) => {
        if (!txinfo.code) {
          height = txinfo.height
        } else {
          throw new Error(`validateTx: failed tx: code: ${txinfo.code}, raw_log: ${txinfo.raw_log}`)
        }
      })
      .catch((err) => {
        if (!err.isAxiosError) {
          console.error(err.message)
        }
      })
  }

  if (!height) {
    throw new Error('validateTx: timeout')
  }

  console.info(`validateTx: height: ${height}`)
  return height
}

interface VoteArgs {
  ledgerMode: boolean
  LCD_URL: string
  chainID: string
  validator: string[]
  source: string[]
  password: string
  keyPath: string
}

export async function vote(args: VoteArgs): Promise<void> {
  const plainEntry: ks.PlainEntity = ks.load(
    args.keyPath,
    'voter',
    args.password || (await promptly.password(`Enter a passphrase:`, { replace: `*` }))
  );
  const wallet = await Secp256k1HdWallet.fromMnemonic(plainEntry.mnemonic);
  const igniteClient = new IgniteClient({...process.env, MNEMONIC: plainEntry.mnemonic} as any, wallet)
  const lcd = LcdClient.withExtensions({apiUrl: args.LCD_URL});

  while (true) {
    const startTime = Date.now()

    await processVote(igniteClient, lcd, args.source, [plainEntry.validator], plainEntry.address)
      .catch((err) => {
        if (err.isAxiosError && err.response) {
          console.error(err.message, err.response.data)
        } else {
          console.error(err.message)
        }

        if (err.isAxiosError) {
          // TODO: switch the client if axios error at some point
          console.info('vote: lcd client unavailable, rotating to next lcd client.')
        }

        resetPrevote()
      })

    await Bluebird.delay(Math.max(500, 500 - (Date.now() - startTime)))
  }
}

function resetPrevote() {
  previousVotePeriod = 0
  previousVoteMsgs = []
}
