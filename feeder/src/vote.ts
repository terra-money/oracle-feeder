/* eslint-disable prettier/prettier */
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
  Fee,
  isTxError,
  LCDClientConfig,
  BlockInfo,
} from '@terra-money/terra.js'
import * as packageInfo from '../package.json'
import { CLIArgs } from 'index'
import { Completer } from 'readline'
import { exit } from 'process'




interface LCDRotationProfile{
  config     : LCDClientConfig
  up_since   : string
  uptimes    : string[][]
  avg_latency: number,
  priority   : number
}

class LCDRotation{

    private timeout          : number               ;
    private restore_lead_freq: number               ;
    private chainId          : string               ;
    public  currentLCDC      : LCDClient            ;
    private clients          : LCDRotationProfile[] = [] ;


  constructor(

    /**!-------------------------------------[※]------------------------------------------#
     * Could do a few small things here possibly in the longer run, of course, like in any failover.
     * some useful features might include:
     * - more granular priority modes for leader-lcds cohort. 
     *  i.e. descdending/roundrobin, but priority over regular lcds/random-sampling
     * - periodically pinging the set and recording the running average latency, reprioritizing accordingly
     * - adding new members inflight 
     * - pruning nodes that have been ded for longer than x
     */

    LCD_leader_clients : string[],
    LCD_clients        : string[],
    // registring this one chainId argument 
    // even though every LCD Config is able to take potentially different chain ids with different URL
    // TODO: A suggestion in this case is to add a "registerClient" method that will add each client individually
    chainID            : string, 
    leader_re_frequency: number,
    timeout_threshold  : number){


      if ( [...LCD_leader_clients, ...LCD_clients].length < 1 ){
        throw 'At least a single LCD client must be specified.'
      }

      this.restore_lead_freq = leader_re_frequency;
      this.timeout           = timeout_threshold;

      var valn = LCD_leader_clients.length + LCD_clients.length

      LCD_leader_clients.map(url => 
        this.clients.push({ 
            priority   : valn--,
            avg_latency: -1,
            uptimes    : [],
            up_since   : 'never',
            config     : makeLCDConfig(url,this.chainId)
        } as LCDRotationProfile)
      )

      LCD_clients.map(url => 
        this.clients.push({ 
            priority   : 0,
            avg_latency: -1,
            uptimes    : [],
            up_since   : 'never',
            config     : makeLCDConfig(url, this.chainId)
        } as LCDRotationProfile)
      )

      this.currentLCDC =  new LCDClient(this.clients[0].config)
      


      // 1.create a config and corresponding profile for every LCD url 
      // 2.prioritize those in the leader pool
      // 3.if all leaders are down -- attempt to restore with frequency specified, 
        // go down the leader list and attempt to reconnect 
      // 4.for every client, leader or not, ping them every X minutes and record average latency
      // 5.for the client that becomes active -- record uptime and if it fails -- add uptime to log

  }

  

  public register_lcd(url:string, chainId: string):void {

    return

  }

  public rotate():void{
    return 
  }

}

const ax = axios.create({
  httpAgent : new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout   : 10000,
  headers   : {
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

async function loadOracleParams(client: LCDClient): Promise<{
  oracleVotePeriod : number
  oracleWhitelist  : string[]
  currentVotePeriod: number
  indexInVotePeriod: number
  nextBlockHeight  : number
}> {
  const oracleParams              = await client.oracle.parameters()
  const oracleVotePeriod          = oracleParams.vote_period
  const oracleWhitelist: string[] = oracleParams.whitelist.map((e) => e.name)
  const latestBlock:BlockInfo     = await client.tendermint.blockInfo()
  
  const nextBlockHeight   = parseInt(latestBlock.block.header.height, 10) + 1 // the vote will be included in the next blocj
  const currentVotePeriod = Math.floor(nextBlockHeight / oracleVotePeriod) // ※ Would be nice to have this link to Terra Docs
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
  currency: string
  price   : string
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
 * preparePrices traverses prices array for following logics:
 * 1. Removes price that cannot be found in oracle whitelist
 * 2. Fill abstain prices for prices that cannot be found in price source but in oracle whitelist
 */
function preparePrices(prices: Price[], oracleWhitelist: string[]): Price[] {
  const newPrices = prices
    .map((price) => {
      const { currency } = price

      if (oracleWhitelist.indexOf(`u${currency.toLowerCase()}`) === -1) {
        return
      }
      return price
    })
    .filter(Boolean) as Price[]

    console.log("Got new prices")
  oracleWhitelist.forEach((denom) => {
    const found = prices.filter(({ currency }) => denom === `u${currency.toLowerCase()}`).length > 0

    if (!found) {
      newPrices.push({

        currency: denom.slice(1).toUpperCase(),
        price: '0.000000000000000000',

      })

    }
  })

  return newPrices
}

function buildVoteMsgs(
  prices   : Price[],
  valAddrs : string[],
  voterAddr: string
  )        : MsgAggregateExchangeRateVote[] {
  const coins = prices.map(({ currency, price }) => `${price}u${currency.toLowerCase()}`).join(',')

  return valAddrs.map((valAddr) => {
    const salt = crypto.randomBytes(2).toString('hex')
    return new MsgAggregateExchangeRateVote(coins, salt, voterAddr, valAddr)
  })
}

let previousVoteMsgs: MsgAggregateExchangeRateVote[] = []
let previousVotePeriod                               = 0

// yarn start vote command
export async function processVote(
  client   : LCDClient,
  wallet   : Wallet,
  priceURLs: string[],
  valAddrs : string[],
  voterAddr: string
  )        : Promise<void> {
  const {
    oracleVotePeriod,
    oracleWhitelist,
    currentVotePeriod,
    indexInVotePeriod,
    nextBlockHeight,
  } = await loadOracleParams(client)

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
  const prices = preparePrices(await getPrices(priceURLs), oracleWhitelist)

  // Build Exchange Rate Vote Msgs
  const voteMsgs: MsgAggregateExchangeRateVote[] = buildVoteMsgs(prices, valAddrs, voterAddr)

  // Build Exchange Rate Prevote Msgs
  const isPrevoteOnlyTx = previousVoteMsgs.length === 0
  const msgs = [...previousVoteMsgs, ...voteMsgs.map((vm) => vm.getPrevote())]
  const tx = await wallet.createAndSignTx({
    msgs,
    fee: new Fee((1 + msgs.length) * 50000, []),
    memo: `${packageInfo.name}@${packageInfo.version}`,
  })

  const res = await client.tx.broadcastSync(tx).catch((err) => {
    console.error(`broadcast error: ${err.message}`, tx.toData())
    throw err
  })

  if (isTxError(res)) {
    console.error(`broadcast error: code: ${res.code}, raw_log: ${res.raw_log}`)
    return
  }

  const txhash = res.txhash
  console.info(`broadcast success: txhash: ${txhash}`)

  const height = await validateTx(
    client,
    nextBlockHeight,
    txhash,
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
  timeoutHeight: number
): Promise<number> {
  let height = 0

  // wait 3 blocks
  const maxBlockHeight = nextBlockHeight + timeoutHeight

  // current block height
  let lastCheckHeight = nextBlockHeight - 1

  while (!height && lastCheckHeight < maxBlockHeight) {
    await Bluebird.delay(1500)

    const lastBlock = await client.tendermint.blockInfo()
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

const makeLCDConfig = (URL:string, chainID:string): LCDClientConfig => ( {URL,chainID})




// export async function vote(args: Required<Omit<CLIArgs,'subparser_name'|'ledgerMode'|'verbose'>> ): Promise<void> {
export async function vote(
  { keyPath                     ,
    password                    ,
    validators                  ,
    sources                     ,
    chainID                     ,
    lcdAddresses                ,
    lcdAddressesLeaders         , }:{
      keyPath            :string  ,
      password           :string  ,
      validators         :string[],
      sources            :string[],
      chainID            :string  ,
      lcdAddresses       :string[],
      lcdAddressesLeaders:string[], }
): Promise<void> {





  // Grab and initialize the key
  const rawKey: RawKey = await initKey(keyPath, password)
  const voterAddr      = rawKey.accAddress
  const validatorAddrs = validators || [rawKey.valAddress]
  const rotation       = new LCDRotation(lcdAddressesLeaders,lcdAddresses,chainID, 3000,3000)

  // Create a Terra Lite client from the first argument in the list
  // ※ This could be cleaner
  
  process.env.VERBOSE ?  console.info("\x1b[36mBegun voting process.\x1b[0m"): ''

  while (true) {


    const startTime = Date.now()

    await processVote(
      rotation.currentLCDC,
      rotation.currentLCDC.wallet(rawKey),
      sources,
      validatorAddrs,
      voterAddr
    )
    .then(r=>{console.log("Voted successfully. LCD Responded: ", r)})
    .catch((err) => {
        if (err.isAxiosError) {
          if (process.env.VERBOSE){
            console.error(`Current LCD(${rotation.currentLCDC.config.URL} | ${rotation.currentLCDC.oracle.feederAddress}) failed  with error : `, err)
            console.info(`Rotating to next `)

          }
          console.info('vote: lcd client unavailable, rotating to next lcd client.')
          rotation.rotate()
      }
        if (err.isAxiosError && err.response) {
          console.error(err.message, err.response.data)
        } else {
          console.error(err.message)
        }


      resetPrevote()
    })

    await Bluebird.delay(Math.max(500, 500 - (Date.now() - startTime)))
  }
}

function resetPrevote() {
  previousVotePeriod = 0
  previousVoteMsgs   = []
}
