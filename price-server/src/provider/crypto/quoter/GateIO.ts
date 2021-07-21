import * as GateAPI from 'gate-api'
import { num } from 'lib/num'
import { errorHandler } from 'lib/error'
import { Quoter, Trades } from 'provider/base'

const apiInstance = new GateAPI.SpotApi()

export class GateIO extends Quoter {
  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    return new Promise((resolve, reject) => {
      const currencyPair = symbol.replace('/', '_')

      apiInstance.listCandlesticks(
        currencyPair,
        {
          limit: 200,
          interval: '1m',
        },
        (error, data: string[][]) => {
          if (error) {
            reject(error)
          } else {
            const trades: Trades = []

            for (let i = 0; i < data.length; i += 1) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const [timestamp, volume, close, high, low, open] = data[i]

              trades.push({
                price: num(close),
                volume: num(volume),
                timestamp: +timestamp,
              })
            }

            resolve(trades)
          }
        }
      )
    })
  }

  protected async update(): Promise<boolean> {
    for (const symbol of this.symbols) {
      await this.fetchLatestTrades(symbol)
        .then((trades) => {
          if (!trades.length) {
            return
          }

          this.setTrades(symbol, trades)
          this.setPrice(symbol, trades[trades.length - 1].price)
          // this.calculateKRWPrice(symbol)
        })
        .catch(errorHandler)
    }

    return true
  }
}
