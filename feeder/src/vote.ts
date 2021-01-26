import * as crypto from 'crypto'
import * as Bluebird from 'bluebird'
import * as promptly from 'promptly'
import * as http from 'http'
import * as https from 'https'
import axios from 'axios'
import * as ks from './keystore'
import {
  LCDClient,
  RawKey,
  Wallet,
  MsgAggregateExchangeRateVote,
  isTxError,
} from '@terra-money/terra.js'

const ax = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout: 30000,
  headers: {
    post: {
      'Content-Type': 'application/json',
    },
  },
})

async function initKey(keyPath: string, password?: string): Promise<RawKey> {
  const plainEntity = ks.load(
    keyPath,
    'voter',
    password || (await promptly.password(`Enter a passphrase:`, { replace: `*` }))
  )

  return new RawKey(Buffer.from(plainEntity.privateKey, 'hex'))
}

async function loadOracleParams(
  client: LCDClient
): Promise<{
  oracleVotePeriod: number
  oracleWhitelist: string[]
  currentVotePeriod: number
  indexInVotePeriod: number
}> {
  const oracleParams = await client.oracle.parameters()
  const oracleVotePeriod = oracleParams.vote_period
  const oracleWhitelist: string[] = oracleParams.whitelist.map((e) => e.name)

  const latestBlock = await client.tendermint.blockInfo()
  const currentBlockHeight = parseInt(latestBlock.block.header.height, 10)
  const currentVotePeriod = Math.floor(currentBlockHeight / oracleVotePeriod)
  const indexInVotePeriod = currentBlockHeight % oracleVotePeriod

  return {
    oracleVotePeriod,
    oracleWhitelist,
    currentVotePeriod,
    indexInVotePeriod,
  }
}

interface Price {
  currency: string
  price: string
}

async function getPrices(sources: string[]): Promise<Price[]> {
  console.info(`timestamp: ${new Date().toUTCString()}`)
  console.info(`getting price data from`, sources)

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
        console.error('invalid price response')
        return false
      }

      // Ignore prices older than 60 seconds ago
      if (Date.now() - new Date(data.created_at).getTime() > 60 * 1000) {
        console.info('price is too old')
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
 * fillAbstainPrices returns abstain prices array for denoms that can be found in oracle whitelist
 * but not in the prices
 */
function fillAbstainPrices(prices: Price[], oracleWhitelist: string[]) {
  const abstainPrices: Price[] = []

  oracleWhitelist.forEach((denom) => {
    const found = prices.filter(({ currency }) => denom === `u${currency.toLowerCase()}`).length > 0

    if (!found) {
      abstainPrices.push({
        currency: denom.slice(1).toUpperCase(),
        price: '0.000000000000000000',
      })
    }
  })

  return abstainPrices
}

/**
 * filterPrices treverses prices array for following logics:
 * 1. Removes price that cannot be found in oracle white list
 * 2. Mutates price with 0.00 for abstaining vote which are not listed in denoms parameter
 * 3. Fill abstain prices
 */
function filterPrices(prices: Price[], oracleWhitelist: string[], denoms: string[]): Price[] {
  const newPrices = prices
    .map((price) => {
      const { currency } = price

      if (oracleWhitelist.indexOf(`u${currency.toLowerCase()}`) === -1) {
        return
      }

      if (denoms.indexOf(currency.toLowerCase()) === -1) {
        return { currency, price: '0.000000000000000000' }
      }

      return price
    })
    .filter(Boolean) as Price[]

  return newPrices.concat(fillAbstainPrices(newPrices, oracleWhitelist))
}

function buildVoteMsgs(
  prices: Price[],
  valAddrs: string[],
  voterAddr: string
): MsgAggregateExchangeRateVote[] {
  const coins = prices.map(({ currency, price }) => `${price}u${currency.toLowerCase()}`).join(',')

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
  priceURLs: string[],
  valAddrs: string[],
  voterAddr: string,
  denoms: string[]
): Promise<void> {
  const {
    oracleVotePeriod,
    oracleWhitelist,
    currentVotePeriod,
    indexInVotePeriod,
  } = await loadOracleParams(client)

  // Skip until new voting period
  // Skip when index [0, oracleVotePeriod - 1] is bigger than oracleVotePeriod - 2 or index is 0
  if (
    (previousVotePeriod && currentVotePeriod === previousVotePeriod) ||
    indexInVotePeriod === 0 ||
    oracleVotePeriod - indexInVotePeriod < 2
  ) {
    return
  }

  // If it failed to reveal the price,
  // reset the state by throwing error
  if (previousVotePeriod && currentVotePeriod - previousVotePeriod !== 1) {
    throw new Error('Failed to Reveal Exchange Rates; reset to prevote')
  }

  // Removes non-whitelisted currencies and abstain vote for currencies that are not in denoms parameter
  // Abstain for not fetched currencies
  const prices = filterPrices(await getPrices(priceURLs), oracleWhitelist, denoms)

  // Build Exchage Rate Vote Msgs
  const voteMsgs: MsgAggregateExchangeRateVote[] = buildVoteMsgs(prices, valAddrs, voterAddr)

  // Build Exchage Rate Prevote Msgs
  const msgs = [...previousVoteMsgs, ...voteMsgs.map((vm) => vm.getPrevote())]
  const tx = await wallet.createAndSignTx({ msgs })

  const res = await client.tx.broadcastSync(tx).catch((err) => {
    console.error(tx.toJSON())
    throw err
  })

  if (isTxError(res)) {
    console.error(`broadcast error: code: ${res.code}, raw_log: ${res.raw_log}`)
    return
  }

  const height = await validateTx(client, res.txhash)
  if (height == 0) {
    console.error(`broadcast error: txhash not found: ${res.txhash}`)
    return
  }

  console.log(`broadcast success: txhash: ${res.txhash}`)

  // Update last success VotePeriod
  previousVotePeriod = Math.floor(height / oracleVotePeriod)
  previousVoteMsgs = voteMsgs
}

async function validateTx(client: LCDClient, txhash: string): Promise<number> {
  let height = 0
  let max_retry = 20

  while (!height && max_retry > 0) {
    await Bluebird.delay(1000)
    max_retry--

    await client.tx
      .txInfo(txhash)
      .then((txinfo) => {
        height = txinfo.height
      })
      .catch((err) => {
        // print except for 404 not found error
        if (err.isAxiosError && err.response && err.response.status !== 404) {
          console.error(err.response.data)
        } else if (!err.isAxiosError) {
          console.error(err.message)
        }
      })
  }

  return height
}

interface VoteArgs {
  ledgerMode: boolean
  lcdAddress: string
  chainID: string
  validator: string[]
  source: string[]
  password: string
  denoms: string
  keyPath: string
}

export async function vote(args: VoteArgs): Promise<void> {
  const client = new LCDClient({
    URL: args.lcdAddress,
    chainID: args.chainID,
    gasPrices: { /*uluna: '0.15',*/ ukrw: '1.7805' },
  })
  const rawKey: RawKey = await initKey(args.keyPath, args.password)
  const valAddrs = args.validator || [rawKey.valAddress]
  const voterAddr = rawKey.accAddress
  const denoms = args.denoms.split(',').map((s) => s.toLowerCase())
  const wallet = new Wallet(client, rawKey)

  while (true) {
    const startTime = Date.now()

    await processVote(client, wallet, args.source, valAddrs, voterAddr, denoms).catch((err) => {
      if (err.isAxiosError && err.response) {
        console.error(err.message, err.response.data)
      } else {
        console.error(err.message)
      }

      previousVotePeriod = 0
      previousVoteMsgs = []
    })

    await Bluebird.delay(Math.max(3000, 3000 - (Date.now() - startTime)))
  }
}
