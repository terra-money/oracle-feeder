import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { Quoter } from 'provider/base'
import BigNumber from 'bignumber.js'

interface Response {
  pools: Array<{
    id: string
    pool_assets: Array<PoolAsset>
  }>
}

interface PoolWithDenom {
  id: string
  denom: string
  price: BigNumber
  pool_assets: Array<PoolAsset>
}

interface PoolAsset {
  token: Token
  weight: string
}

interface Token {
  denom: string
  amount: string
}

export class Osmosis extends Quoter {
  private LCDS = [
    { url: 'https://osmosis-api.polkachu.com/osmosis/gamm/v1beta1/pools?pagination.limit=801', used: false },
    { url: 'https://lcd.osmosis.zone/osmosis/gamm/v1beta1/pools?pagination.limit=801', used: false },
  ]

  private async updatePrices(): Promise<void> {
    const url = this.rotateUrl()

    const response: Response = await fetch(url, { timeout: this.options.timeout }).then((res) => res.json())
    if (!response) {
      logger.error(`${this.constructor.name}: wrong api response`, response ? JSON.stringify(response) : 'empty')
      throw new Error('Invalid response from Osmosis')
    }
    let pools = this.getWhitelistedPools(response)

    pools = pools.map((pool) => {
      const asset1 = pool.pool_assets[0]
      const asset2 = pool.pool_assets[1]

      pool.price =
        asset1.token.denom === 'uosmo'
          ? BigNumber(asset1.token.amount).dividedBy(BigNumber(asset2.token.amount))
          : BigNumber(asset2.token.amount).dividedBy(BigNumber(asset1.token.amount))

      return pool
    })

    const OSMO_USDC = pools.find((pool) => pool.denom === 'OSMO/USDC')

    if (OSMO_USDC) {
      pools.forEach((pool) => {
        const price = pool.denom === 'OSMO/USDC' ? pool.price : OSMO_USDC.price.multipliedBy(pool.price)

        this.setPrice(pool.denom, price)
      })
    } else throw new Error('OSMO/USDC not found in the list of pools')
  }

  /**
   * Rotate the LCD to take the next unused url
   * mark it as used and keeps going.
   *
   * If all URLS are used picks the first URL and
   * set the other urls to unused
   * @returns LCD URL
   */
  private rotateUrl(): string {
    const lcdIndex = this.LCDS.findIndex((lcd) => !lcd.used)

    if (lcdIndex) {
      this.LCDS[lcdIndex].used = true
      return this.LCDS[lcdIndex].url
    } else {
      this.LCDS = this.LCDS.map((lcd) => ({ url: lcd.url, used: false }))

      this.LCDS[0].used = true
      return this.LCDS[0].url
    }
  }

  /**
   * This function parse the response from the LCD
   * @param response from the request to LCD
   * @returns list of whitelisted pools appending the PAIR DENOM
   */
  private getWhitelistedPools(response: Response): Array<PoolWithDenom> {
    const res = new Array<PoolWithDenom>()
    const whitelistedPools = Object.values(OSMOSIS_POOL_IDS)
    const filteredPools = response.pools.filter((pool) => whitelistedPools.includes(pool.id))

    filteredPools.forEach((pool) => {
      for (const symbol in OSMOSIS_POOL_IDS) {
        if (OSMOSIS_POOL_IDS[symbol] === pool.id) {
          res.push({ ...pool, denom: symbol, price: BigNumber(0) })
        }
      }
    })

    return res
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

const OSMOSIS_POOL_IDS = {
  'ATOM/USDC': '1',
  'AKT/USDC': '3',
  // 'CRO/USDC': '9',      // DOUBLE CHECK
  'JUNO/USDC': '497',
  // 'USTC/USDC': '560',   // DOUBLE CHECK
  'SCRT/USDC': '584',
  'STARS/USDC': '604',
  // 'DAI/USDC': '674',    // DOUBLE CHECK
  'OSMO/USDC': '678',
  // 'EVMOS/USDC': '722',  // DOUBLE CHECK
  'INJ/USDC': '725',
  'LUNA/USDC': '726',
  'KAVA/USDC': '730',
  'LINK/USDC': '731',
  // 'MKR/USDC': '733',    // DOUBLE CHECK
  // 'DOT/USDC': '773',    // DOUBLE CHECK
  'LUNC/USDC': '800',
}
export default Osmosis
