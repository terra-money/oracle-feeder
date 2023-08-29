import { PriceBySymbol } from 'provider/base'
import { fiatProvider, cryptoProvider } from 'provider'
import { getBaseCurrency, getQuoteCurrency } from 'lib/currency'
import * as _ from 'lodash'
import { average, hasOutliers } from 'lib/statistics'

export default class PricesProvider {
  // TODO: maybe ?? for a future version of the method
  // group prices by USD and get the average price of
  // the assets in USD before parsing from stablecoin to USD

  static getCryptoPrices(): PriceBySymbol {
    // get crypto prices that can be priced in different
    // stable denom (USDT/USDC/BUSD) and even USD,
    const cryptoPrices = cryptoProvider.getPrices()
    // Define a list where to store the end result of
    // parsing the USDT / USDC / BUSD to USD
    const CRYPTO_PRICES_TO_USD = new Array<PriceBySymbol>()

    for (const key in cryptoPrices) {
      const price = cryptoPrices[key]
      const isPricedInUSD = key.endsWith('/USD')

      // When priced in USD: store the object directly in the array
      if (isPricedInUSD) {
        CRYPTO_PRICES_TO_USD.push({ [key]: price })
      } else {
        // Get base currency LUNA, ETH, BTC...
        const base = getBaseCurrency(key)
        // Get symbol USD, USDT, BUSD, USDC...
        const symbol = getQuoteCurrency(key)
        // Create the key for the new asset e.g. LUNA/USD, BTC/USD, ETH/USD, ...
        const ASSET_KEY_USD = base + '/USD'
        // Since stable coins are also priced in USD
        // this creates the symbol to get its price e.g. USDT/USD, BUSD/USD, ...
        const stableCoinSymbol = symbol + '/USD'
        const stableCoinPrice = cryptoPrices[stableCoinSymbol]

        // find price of asset in USD denom e.g: BTC/USD = BTC/UST * UST/USD
        const TO_USD = price.multipliedBy(stableCoinPrice)
        // store the object in the array
        CRYPTO_PRICES_TO_USD.push({ [ASSET_KEY_USD]: TO_USD })
      }
    }

    const data: any = _.chain(CRYPTO_PRICES_TO_USD)
      // Filter out the crypto that failed to be
      // converted to USD (all values that are no a number)
      .filter((crypto) => {
        const key = Object.keys(crypto)[0]
        return !crypto[key].isNaN()
      })
      /** Group DENOM/USD occurrences in arrays of objects e.g.:
        [
          {'LUNA/USD': [
            { 'LUNA/USD': [BigNumber] },
            { 'LUNA/USD': [BigNumber] },
            { 'LUNA/USD': [BigNumber] }
          ]},
        ...]
      */
      .groupBy((crypto) => Object.keys(crypto)[0])
      // iterate the grouped arrays ...
      .flatMap((cryptoGroups) => {
        const key = Object.keys(cryptoGroups[0])[0]
        const prices = cryptoGroups.map((price) => price[key])

        // Error if there is a 10% or more difference in the price list
        // For example, if the list is [10, 10, 10, 50] and you calculate the average,
        // you will get incorrect results.
        if (hasOutliers(prices)) {
          console.error(
            `Skipping symbol ${key} due to outliers`,
            prices.map((p) => p.toString())
          )
          return {}
        } else {
          // ... return a unique object with the average
          return { [key]: average(prices) }
        }
      })
      // Transform the array of objects to a single object
      // with the keys being the pairs
      .reduce((memo, crypto) => {
        const key = Object.keys(crypto)[0]
        const value = crypto[key]

        return { ...memo, [key]: value }
      }, {})
      .value()

    return data
  }

  static getFiatPrices(): PriceBySymbol {
    return fiatProvider.getPrices()
  }
}
