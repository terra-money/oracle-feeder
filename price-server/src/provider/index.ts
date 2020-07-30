import { Provider, PriceByQuote } from './base'
import * as bluebird from 'bluebird'
import { errorHandler } from 'lib/error'
import { report } from './reporter'
import LunaProvider from './luna/LunaProvider'
import FiatProvider from './fiat/FiatProvider'

export const fiatProvider = new FiatProvider('KRW')

const providers: Provider[] = [
  new LunaProvider('LUNA'), // base currency is LUNA (LUNA/KRW LUNA/USD LUNA/...)
  fiatProvider // base currency is KRW (KRW/USD KRW/SDR KRW/MNT ...)
]

export async function initialize(): Promise<void> {
  await Promise.all(providers.map(provider => provider.initialize()))

  await loop()
}

export function getLunaPrices(): PriceByQuote {
  let lunaPrices: PriceByQuote = {}

  // collect luna prices
  for (const provider of providers) {
    lunaPrices = Object.assign(lunaPrices, provider.getLunaPrices(lunaPrices))
  }

  return lunaPrices
}

async function loop(): Promise<void> {
  while (true) {
    const now = Date.now()

    await bluebird.mapSeries(providers, provider => provider.tick(now)).catch(errorHandler)

    report(now)

    await bluebird.delay(10)
  }
}
