import * as config from 'config'
import * as bluebird from 'bluebird'
import { errorHandler } from 'lib/error'
import { Provider } from './base'
import { report } from './reporter'
import FiatProvider from './fiat/FiatProvider'
import CryptoProvider from './crypto/CryptoProvider'
import LunaProvider from './crypto/LunaProvider'

export const fiatProvider = new FiatProvider(config.fiatProvider)
export const cryptoProvider = new CryptoProvider(config.cryptoProvider)
export const lunaProvider = new LunaProvider(config.lunaProvider)

const providers: Provider[] = [fiatProvider, cryptoProvider, lunaProvider]

export async function initialize(): Promise<void> {
  await bluebird.mapSeries(providers, (provider) => provider.initialize())

  await loop()
}

async function loop(): Promise<void> {
  while (true) {
    const now = Date.now()

    await bluebird.mapSeries(providers, (provider) => provider.tick(now)).catch(errorHandler)

    report(now)

    await bluebird.delay(10)
  }
}
