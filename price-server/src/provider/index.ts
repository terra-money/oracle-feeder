import * as config from 'config'
import * as bluebird from 'bluebird'
import { errorHandler } from 'lib/error'
import { Provider } from './base'
import { report } from './reporter'
import FiatProvider from './fiat/FiatProvider'
import CryptoProvider from './crypto/CryptoProvider'

export const fiatProvider = new FiatProvider(config.fiatProvider)
export const cryptoProvider = new CryptoProvider(config.cryptoProvider)

const providers: Provider[] = [fiatProvider, cryptoProvider]

export async function initialize(): Promise<void> {
  for (const provider of providers) {
    await provider.initialize()
  }
}

export async function tick(now: number): Promise<void> {
  await bluebird.mapSeries(providers, (provider) => provider.tick(now)).catch(errorHandler)

  report(now)
}
