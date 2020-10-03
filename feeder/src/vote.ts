import * as crypto from 'crypto'
import * as Bluebird from 'bluebird'
import * as promptly from 'promptly'
import * as http from 'http'
import * as https from 'https'
import axios from 'axios'
import * as ks from './keystore'
import {
  LCDClient,
  OracleWhitelist,
  RawKey,
  Wallet,
  MsgAggregateExchangeRateVote,
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
  const oracleWhitelist: string[] = (oracleParams.whitelist as OracleWhitelist).map((e) => e.name)

  const latestBlock = await client.tendermint.blockInfo()
  const currentBlockHeight = parseInt(latestBlock.block.header.height, 10)
  const currentVotePeriod = Math.floor(currentBlockHeight / oracleVotePeriod)
  const indexInVotePeriod = currentBlockHeight % oracleVotePeriod

  return { oracleVotePeriod, oracleWhitelist, currentVotePeriod, indexInVotePeriod }
}

interface Price {
  currency: string
  price: string
}

async function getPrices(sources: string[]): Promise<Price[]> {
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

function filterPrices(prices: Price[], oracleWhitelist: string[], denoms: string[]): Price[] {
  return prices
    .map(({ currency }) => {
      if (oracleWhitelist.indexOf(`u${currency.toLowerCase()}`) === -1) {
        return
      }

      if (denoms.indexOf(currency.toLowerCase()) === -1) {
        return { currency, price: '-1.000000000000000000' }
      }
    })
    .filter(Boolean) as Price[]
}

function fillAbstainPrices(oracleWhitelist: string[], prices: Price[]) {
  oracleWhitelist.forEach((denom) => {
    let found = false

    prices.every(({ currency }) => {
      if (denom === `u${currency.toLowerCase()}`) {
        found = true
        return false
      }

      return true
    })

    if (!found) {
      prices.push({ currency: denom.slice(1).toUpperCase(), price: '-1.000000000000000000' })
    }
  })
}

function buildVoteMsgs(
  prices: Price[],
  valAddrs: string[],
  voterAddr: string
): MsgAggregateExchangeRateVote[] {
  const coins = prices
    .map(({ currency, price }) => {
      const denom = `u${currency.toLowerCase()}`
      return `${price}${denom}`
    })
    .join(',')

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
  // Skip left block is equal with or less than a block in VotePeriod
  if (
    (previousVotePeriod && previousVotePeriod === currentVotePeriod) ||
    indexInVotePeriod >= oracleVotePeriod - 1
  ) {
    return
  }

  const prices = await getPrices(priceURLs)

  // Make not intended denoms prices to zero (abstain)
  // Remove denoms not in
  filterPrices(prices, oracleWhitelist, denoms)

  // Fill '0' price for not fetched currencies (abstain)
  fillAbstainPrices(oracleWhitelist, prices)

  // Build Exchage Rate Vote Msgs
  const voteMsgs: MsgAggregateExchangeRateVote[] = buildVoteMsgs(prices, valAddrs, voterAddr)

  // Build Exchage Rate Prevote Msgs
  const msgs = [...previousVoteMsgs, ...voteMsgs.map((vm) => vm.getPrevote())]
  const tx = await wallet.createAndSignTx({ msgs })

  await client.tx
    .broadcastSync(tx)
    .then(({ code, txhash, raw_log }) => {
      if (!code) {
        return validateTx(client, txhash).then((height) => {
          if (height == 0) {
            console.error(`broadcast error: txhash not found: ${txhash}`)
          } else {
            console.log(`broadcast success: txhash: ${txhash}`)

            // Update last success VotePeriod
            previousVotePeriod = Math.floor(height / oracleVotePeriod)
            previousVoteMsgs = voteMsgs
          }
        })
      } else {
        console.error(`broadcast error: code: ${code}, raw_log: ${raw_log}`)
      }
    })
    .catch((err) => {
      console.error(tx.toJSON())
      throw err
    })
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
      .catch((_) => {
        /* Ignore not found error */
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
    })

    await Bluebird.delay(Math.max(3000, 3000 - (Date.now() - startTime)))
  }
}
