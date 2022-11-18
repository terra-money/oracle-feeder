import { PriceBySymbol } from 'provider/base'
import { fiatProvider, cryptoProvider } from 'provider'

export function getCryptoPrices(): PriceBySymbol {
  return cryptoProvider.getPrices()
}

export function getFiatPrices(): PriceBySymbol {
  return fiatProvider.getPrices()
}
