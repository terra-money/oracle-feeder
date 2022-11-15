import { PriceBySymbol } from 'provider/base'
import { fiatProvider, cryptoProvider } from 'provider'

export function getCryptoPrices(): PriceBySymbol {
  const prices = cryptoProvider.getPrices()

  return prices
}

export function getFiatPrices(): PriceBySymbol {
  const prices = fiatProvider.getPrices()

  return prices
}
