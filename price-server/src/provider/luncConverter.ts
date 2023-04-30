import { PriceBySymbol } from 'provider/base'
import { getBaseCurrency } from 'lib/currency'

export function convertFiatToLunc(cryptoPrices: PriceBySymbol, fiatPrices: PriceBySymbol): PriceBySymbol {
  // make 'LUNC/FIAT' rates
  const luncFiatPrices: PriceBySymbol = {}
  luncFiatPrices['LUNC/USD'] = cryptoPrices['LUNC/USD']

  Object.keys(fiatPrices).map((symbol) => {
    const targetSymbol = `LUNC/${getBaseCurrency(symbol)}`

    // LUNC/FIAT = LUNC/USD / FIAT/USD
    luncFiatPrices[targetSymbol] = cryptoPrices['LUNC/USD'].dividedBy(fiatPrices[symbol])
  })

  return luncFiatPrices
}
