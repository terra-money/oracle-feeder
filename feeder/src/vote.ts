import * as crypto from 'crypto'
import * as Bluebird from 'bluebird'
import * as promptly from 'promptly'
import * as http from 'http'
import * as https from 'https'
import axios from 'axios'
import * as ks from './keystore'
import { LCDClient, RawKey, Wallet, isTxError, LCDClientConfig } from '@terra-money/feather.js'
import * as packageInfo from '../package.json'
import { MsgAggregateExchangeRateVote } from './oracle/msgs'
import * as logger from './logger'
import { OracleAPI } from './oracle/OracleAPI'

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

async function initKey(keyPath: string, name: string, password?: string): Promise<RawKey> {
  const plainEntity = ks.load(
    keyPath,
    name,
    password || (await promptly.password(`Enter a passphrase:`, { replace: `*` }))
  )

  return new RawKey(Buffer.from(plainEntity.privateKey, 'hex'))
}

interface OracleParameters {
  oracleVotePeriod: number
  oracleWhitelist: string[]
  currentVotePeriod: number
  indexInVotePeriod: number
  nextBlockHeight: number
}

async function loadOracleParams(client: LCDClient, oracle: OracleAPI, chainID: string): Promise<OracleParameters> {
  const oracleParams = await oracle.parameters()
  const oracleVotePeriod = oracleParams.vote_period
  const oracleWhitelist: string[] = oracleParams.whitelist.map((e) => e.denom)

  const latestBlock = await client.tendermint.blockInfo(chainID)

  // the vote will be included in the next block
  const blockHeight = parseInt(latestBlock.block.header.height, 10)
  const nextBlockHeight = blockHeight + 1
  const currentVotePeriod = Math.floor(blockHeight / oracleVotePeriod)
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
  price: string
}

async function getPrices(sources: string[]): Promise<Price[]> {
  const results = await Bluebird.some(
    sources.map((s) => ax.get(s)),
    1
  ).then((results) =>
    results.filter(({ data }) => {
      if (typeof data.created_at !== 'string' || !Array.isArray(data.prices) || !data.prices.length) {
        logger.error('getPrices: invalid response')
        return false
      }

      // Ignore prices older than 60 seconds ago
      if (Date.now() - new Date(data.created_at).getTime() > 60 * 1000) {
        logger.error('getPrices: too old')
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
 * preparePrices traverses prices array for following logics:
 * 1. Removes price that cannot be found in oracle whitelist
 * 2. Fill abstain prices for prices that cannot be found in price source but in oracle whitelist
 */
function preparePrices(prices: Price[], oracleWhitelist: string[]): Price[] {
  const newPrices = prices
    .map((price) => {
      if (oracleWhitelist.indexOf(`u${price.denom.toLowerCase()}`) === -1) {
        return
      }

      return price
    })
    .filter(Boolean) as Price[]

  oracleWhitelist.forEach((denom) => {
    const found = prices.filter((price) => denom === `u${price.denom.toLowerCase()}`).length > 0

    if (!found) {
      newPrices.push({
        denom: denom.slice(1).toUpperCase(),
        price: '0.000000',
      })
    }
  })

  return newPrices
}

function buildVoteMsgs(prices: Price[], valAddrs: string[], voterAddr: string): MsgAggregateExchangeRateVote[] {
  const coins = prices.map(({ denom, price }) => `${price}u${denom.toLowerCase()}`).join(',')

  return valAddrs.map((valAddr) => {
    const salt = crypto.randomBytes(2).toString('hex')
    return new MsgAggregateExchangeRateVote(coins, salt, voterAddr, valAddr)
  })
}

let previousVoteMsgs: MsgAggregateExchangeRateVote[] = []
let previousVotePeriod = 0

// yarn start vote command
export async function processVote(
  client: LCDClient,
  wallet: Wallet,
  args: VoteArgs,
  valAddrs: string[],
  voterAddr: string
): Promise<void> {
  const oracle = new OracleAPI(client, args.chainID)
  logger.info(`[VOTE] Requesting on chain data`)
  const { oracleVotePeriod, oracleWhitelist, currentVotePeriod, indexInVotePeriod, nextBlockHeight } =
    await loadOracleParams(client, oracle, args.chainID)

  // Skip until new voting period
  // Skip when index [0, oracleVotePeriod - 1] is bigger than oracleVotePeriod - 2 or index is 0
  if ((previousVotePeriod && currentVotePeriod === previousVotePeriod) || oracleVotePeriod - indexInVotePeriod < 2) {
    return
  }

  // If it failed to reveal the price,
  // reset the state by throwing error
  if (previousVotePeriod && currentVotePeriod - previousVotePeriod !== 1) {
    throw new Error('Failed to Reveal Exchange Rates; reset to prevote')
  }

  // Print timestamp before start
  logger.info(`[VOTE] Requesting prices from price server ${args.dataSourceUrl.join(',')}`)
  const _prices = await getPrices(args.dataSourceUrl)

  // Removes non-whitelisted currencies and abstain for not fetched currencies
  const prices = preparePrices(_prices, oracleWhitelist)

  // Build Exchange Rate Vote Msgs
  const voteMsgs: any[] = buildVoteMsgs(prices, valAddrs, voterAddr)

  logger.info(`[VOTE] Create transaction and sign`)
  // Build Exchange Rate Prevote Msgs
  const isPrevoteOnlyTx = previousVoteMsgs.length === 0
  const msgs = [...previousVoteMsgs, ...voteMsgs.map((vm) => vm.getPrevote())]
  logger.info(`[PREVOTE] msg: ${JSON.stringify(msgs)}\n`)
  const tx = await wallet.createAndSignTx({
    msgs,
    memo: `${packageInfo.name}@${packageInfo.version}`,
    chainID: args.chainID,
  })

  const res = await client.tx.broadcastBlock(tx, args.chainID).catch((err) => {
    logger.error(`broadcast error: ${err.message} ${tx.toData()}`)
    throw err
  })

  if (isTxError(res)) {
    logger.error(`broadcast error: code: ${res.code}, raw_log: ${res.raw_log}`)
    return
  }

  const txhash = res.txhash
  logger.info(`[VOTE] Broadcast success ${txhash}`)

  const height = await validateTx(
    client,
    nextBlockHeight,
    txhash,
    args,
    // if only prevote exist, then wait 2 * vote_period blocks,
    // else wait left blocks in the current vote_period
    isPrevoteOnlyTx ? oracleVotePeriod * 2 : oracleVotePeriod - indexInVotePeriod
  )

  // Update last success VotePeriod
  previousVotePeriod = Math.floor(height / oracleVotePeriod)
  previousVoteMsgs = voteMsgs
}

async function validateTx(
  client: LCDClient,
  nextBlockHeight: number,
  txhash: string,
  args: VoteArgs,
  timeoutHeight: number
): Promise<number> {
  let inclusionHeight = 0

  // wait 3 blocks
  const maxBlockHeight = nextBlockHeight + timeoutHeight

  // current block height
  let lastCheckHeight = nextBlockHeight - 1

  while (!inclusionHeight && lastCheckHeight < maxBlockHeight) {
    await Bluebird.delay(1500)

    const lastBlock = await client.tendermint.blockInfo(args.chainID)
    const latestBlockHeight = parseInt(lastBlock.block.header.height, 10)

    if (latestBlockHeight <= lastCheckHeight) {
      continue
    }

    // set last check height to latest block height
    lastCheckHeight = latestBlockHeight

    // wait for indexing (not sure; but just for safety)
    await Bluebird.delay(500)

    // FIX-ME: replace this rest request with a station.js request. At the moment
    // station.js does not accept custom models which means that it will fail
    // parsing the /oracle.oracle.MsgAggregateExchangeRatePrevote and as a
    // consequence will not return the height which is the parameter we need
    // to operate on.
    await ax
      .get(`${args.lcdUrl}/cosmos/tx/v1beta1/txs/${txhash}`)
      .then((res) => {
        const { height, code, raw_log } = res.data.tx_response

        if (!res.data.code) {
          inclusionHeight = height
        } else {
          throw new Error(`[VOTE]: transaction failed tx: code: ${code}, raw_log: ${raw_log}`)
        }
      })
      .catch((err) => {
        if (!err.isAxiosError) {
          logger.error('txInfo error', err)
        }
      })
  }

  if (!inclusionHeight) {
    throw new Error('[VOTE]: transaction timeout')
  }

  logger.info(`[VOTE] Included at height: ${inclusionHeight}`)
  return inclusionHeight
}

interface VoteArgs {
  lcdUrl: string[]
  prefix: string
  chainID: string
  validator: string[]
  dataSourceUrl: string[]
  password: string
  keyPath: string
  keyName: string
}

function buildLCDClientConfig(args: VoteArgs, lcdIndex: number): Record<string, LCDClientConfig> {
  return {
    [args.chainID]: {
      lcd: args.lcdUrl[lcdIndex],
      chainID: args.chainID,
      gasAdjustment: '1.5',
      gasPrices: { ucandle: 0.0015 },
      prefix: args.prefix,
    },
  }
}

export async function vote(args: VoteArgs): Promise<void> {
  const rawKey: RawKey = await initKey(args.keyPath, args.keyName, args.password)
  const valAddrs: string[] = args.validator || [rawKey.valAddress(args.prefix)]
  const voterAddr = rawKey.accAddress(args.prefix)

  const lcdRotate = {
    client: new LCDClient(buildLCDClientConfig(args, 0)),
    current: 0,
    max: args.lcdUrl.length - 1,
  }

  while (true) {
    const startTime = Date.now()

    await processVote(lcdRotate.client, lcdRotate.client.wallet(rawKey), args, valAddrs, voterAddr).catch((err) => {
      if (err.isAxiosError && err.response) {
        logger.error(err.message, err.response.data)
      } else {
        logger.error(err)
      }

      if (err.isAxiosError) {
        logger.info('vote: lcd client unavailable, rotating to next lcd client.')
        rotateLCD(args, lcdRotate)
      }

      resetPrevote()
    })

    await Bluebird.delay(Math.max(500, 500 - (Date.now() - startTime)))
  }
}

function rotateLCD(args: VoteArgs, lcdRotate: { client: LCDClient; current: number; max: number }) {
  if (++lcdRotate.current > lcdRotate.max) {
    lcdRotate.current = 0
  }

  lcdRotate.client = new LCDClient(buildLCDClientConfig(args, lcdRotate.current))
  logger.info('Switched to LCD address ' + lcdRotate.current + '(' + args.lcdUrl[lcdRotate.current] + ')')

  return
}

function resetPrevote() {
  previousVotePeriod = 0
  previousVoteMsgs = []
}
