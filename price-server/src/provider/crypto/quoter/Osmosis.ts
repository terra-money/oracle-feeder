import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { toQueryString } from 'lib/fetch'
import { Quoter } from 'provider/base'
import { map } from 'bluebird'

interface Response {
  pools: Array<{
    id: string
    pool_assets: Array<PoolAsset>
  }>
}

interface PoolWithDenom {
  id: string
  denom: string
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
      throw new Error('Invalid response from Coingecko')
    }
    const pools = this.getWhitelistedPools(response)
    console.log(response)
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
          res.push({ ...pool, denom: symbol })
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
  'ATOM/USD': '1',
  'AKT/USD': '3',
  'CRO/USD': '9',
  'JUNO/USD': '497',
  'USTC/USD': '560',
  'SCRT/USD': '584',
  'STARS/USD': '604',
  'DAI/USD': '674',
  'OSMO/USD': '678',
  'EVMOS/USD': '722',
  'INJ/USD': '725',
  'LUNA/USD': '726',
  'KAVA/USD': '730',
  'LINK/USD': '731',
  'MKR/USD': '733',
  'DOT/USD': '773',
  'LUNC/USD': '800',
}
export default Osmosis
