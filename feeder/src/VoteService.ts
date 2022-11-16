import * as crypto from 'crypto'
import * as Bluebird from 'bluebird'
import * as http from 'http'
import * as https from 'https'
import axios from 'axios'
import * as packageInfo from '../package.json'
import { Secp256k1HdWallet, BlockResponse, TxsResponse, BroadcastMode } from "@cosmjs/launchpad";
import { IgniteClient } from './oracle/client'
import { Module as OracleModule } from './oracle'
import { OracleAsset, OracleParams } from './oracle/rest'
import { msgAggregateExchangeRateVoteParams } from './oracle/module'
import { EncodeObject } from "@cosmjs/proto-signing";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { ErrorCodes, ModuleData, PlainEntity, Price, VoteServiceConfig } from './models'
import { resolve } from 'path'

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

const CustomClient = IgniteClient.plugin(OracleModule);

export class VoteService {
  client;
  moduleData: ModuleData;
  previousVotePeriod: number = 0;
  previousVoteMsgs: EncodeObject[] = []

  private constructor(
    private readonly config: VoteServiceConfig,
    private readonly entry: PlainEntity,
    wallet: Secp256k1HdWallet
  ) {
    const client = new CustomClient({ 
      apiUrl: config.lcdUrl, 
      rpcUrl: config.rpcUrl,
      broadcastMode: BroadcastMode.Block
    }, wallet);
    this.client = client;
  }

  static async getNewService(config: VoteServiceConfig, entry: PlainEntity): Promise<VoteService> {
    const wallet = await Secp256k1HdWallet.fromMnemonic(entry.mnemonic);
    return new VoteService(config, entry, wallet)
  }

  async process(): Promise<any> {
    // Load necessary data from the blockchain to calculate the vote rate
    await this.loadModuleData();

    // Validate loaded data
    const [_, err] = await this.preValidateModuleData();
    if (err) {
      // TODO: do something on error
      return Promise.reject(err);
    }

    // Print timestamp before start
    console.info(`[${new Date().toUTCString()}][VoteService] before request prices`)

    // Request prices from price-server 
    const prices = await this.getPrices();

    // Removes non-whitelisted currencies and abstain for not fetched currencies
    const oracleAssets = this.prepareOracleAssets(prices)

    // Build Exchange Rate Vote Msgs
    const msgs: EncodeObject[] = this.buildEncodedAssetList(oracleAssets)

    // Sign & Broadcast the msgs
    const txRes = (await this.client.signAndBroadcast(
      msgs,
      { gas: (1 + msgs.length) * 50000 },
      `${packageInfo.name}@${packageInfo.version}`,
    )) as DeliverTxResponse;

    console.info(`[${new Date().toUTCString()}][VoteService] Transaction broadcasted successfully with hash ${txRes.transactionHash}`)

    const [height, err2] = await this.validateTx(txRes.transactionHash)

    if (err2) {
      // TODO: do something on error
      return Promise.reject(err);
    }

    // Update last success VotePeriod
    this.previousVotePeriod = Math.floor(height / this.moduleData.oracleVotePeriod)
    this.previousVoteMsgs = msgs;

    return Promise.resolve();
  }

  preValidateModuleData(): [boolean, string | null] {
    const { currentVotePeriod } = this.moduleData;

    // Skip until new voting period
    // Skip when index [0, this.moduleData.oracleVotePeriod - 1] 
    //  is bigger than this.moduleData.oracleVotePeriod - 2 or index is 0
    if ((this.previousVotePeriod && currentVotePeriod === this.previousVotePeriod) ||
      (this.moduleData.oracleVotePeriod - this.moduleData.indexInVotePeriod < 2)) {
      return [false, ErrorCodes.SKIP_VOTING_PERIOD]
    }

    // If it failed to reveal the price,
    // reset the state by throwing error
    if (this.previousVotePeriod && currentVotePeriod - this.previousVotePeriod !== 1) {
      return [false, ErrorCodes.FAILED_TO_REVEAL_EXCHANGE_RATES]
    }

    return [true, null]
  }

  async loadModuleData(): Promise<void> {
    // Query the blockchain for the required data
    const oracleParams = (await this.client.oracle.query.queryParams()).data.params as OracleParams;
    const oracleVotePeriod = Number(oracleParams.vote_period);
    const oracleWhitelist: OracleAsset[] = oracleParams.whitelist as OracleAsset[];
    const latestBlock = await this.client.lcd.blocksLatest();

    // the vote will be included in the next block
    const nextBlockHeight = parseInt(latestBlock.block.header.height, 10) + 1
    const currentVotePeriod = Math.floor(nextBlockHeight / oracleVotePeriod)
    const indexInVotePeriod = nextBlockHeight % oracleVotePeriod

    this.moduleData = { oracleVotePeriod, oracleWhitelist, currentVotePeriod, indexInVotePeriod, nextBlockHeight }
  }

  async getPrices(): Promise<Price[]> {
    console.info(`getPrices: source: ${this.config.dataSourceUrls.join(',')}`)
    const axPromises = this.config.dataSourceUrls.map((s) => ax.get(s));

    const results = await Bluebird.some(axPromises, 1)
      .then((results) => results.filter(({ data }) => {
        if (typeof data.created_at !== 'string' || !Array.isArray(data.prices) || !data.prices.length) {
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
  prepareOracleAssets(prices: Price[]): OracleAsset[] {
    const newPrices = prices
      .map((price) => {
        const { denom } = price
        const exists = this.moduleData.oracleWhitelist.findIndex(asset => asset.denom?.indexOf(`u${denom.toLowerCase()}`) === -1);

        if (exists === -1) {
          return
        }

        return price
      })
      .filter(Boolean) as OracleAsset[];

    this.moduleData.oracleWhitelist.forEach(asset => {
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

  buildEncodedAssetList(prices: OracleAsset[]): EncodeObject[] {
    const exchangeRates = prices.map(({ denom, amount }) => `${amount}u${denom?.toLowerCase()}`).join(',')

    return this.config.validators
      .map(validator => {
        const salt = crypto.randomBytes(2).toString('hex')
        const feeder = this.entry.address;
        const msg: msgAggregateExchangeRateVoteParams = {
          value: { exchangeRates, salt, feeder, validator },
        }

        return this.client.OracleOracle.tx.msgAggregateExchangeRateVote(msg);
      })
  }


  async validateTx(txhash: string): Promise<[number, string | null]> {
    const { nextBlockHeight, oracleVotePeriod, indexInVotePeriod } = this.moduleData

    // wait 3 blocks
    const maxBlockHeight = nextBlockHeight + (oracleVotePeriod - indexInVotePeriod)

    // current block height
    let lastCheckHeight = nextBlockHeight - 1

    while (lastCheckHeight < maxBlockHeight) {
      await Bluebird.delay(1500)
      const lastBlock = (await this.client.lcd.blocksLatest()) as BlockResponse
      const latestBlockHeight = parseInt(lastBlock.block.header.height, 10)

      if (latestBlockHeight <= lastCheckHeight) {
        continue
      }

      // set last check height to latest block height
      lastCheckHeight = latestBlockHeight

      // wait for indexing (not sure; but just for safety)
      await Bluebird.delay(500)

      const res: TxsResponse = await this.client.lcd.txById(txhash)
        .catch((err) => {
          if (!err.isAxiosError) {
            console.error(err.message)
          }
        });

      if (!res.code) {
        return [Number(res.height), null]
      }
      else {
        return [0, ErrorCodes.VALIDATE_TX_FAILED + res.code + res.raw_log]
      }
    }
    return [0, ErrorCodes.VALIDATE_TX_TIMEOUT]
  }

  resetPrevote() {
    this.previousVotePeriod = 0
    this.previousVoteMsgs = []
  }
}
