import * as config from 'config'
import * as _ from 'lodash'
import { format, isSameDay, isSameMinute, addMinutes } from 'date-fns'
import * as logger from 'lib/logger'
import { createReporter } from 'lib/reporter'
import PricesProvider from './PricesProvider'

let reporter
let reportedAt = Date.now()

export function report(now: number): void {
  if (isSameMinute(now, reportedAt)) {
    return
  }

  try {
    const cryptoPrices = _.reduce(
      PricesProvider.getCryptoPrices(),
      (result, value, key) => Object.assign(result, { [key]: value }),
      {}
    )
    const fiatPrices = _.reduce(
      PricesProvider.getFiatPrices(),
      (result, value, key) => Object.assign(result, { [key]: value }),
      {}
    )
    const prices = Object.assign(cryptoPrices, fiatPrices)

    if (!config.report) {
      reportedAt = now
      return
    }

    if (!reporter || !isSameDay(now, reportedAt)) {
      reporter = createReporter(`report/prices_${format(now, 'MM-dd_HHmm')}.csv`, [
        'time',
        ...Object.keys(prices).map((quote) => quote),
      ])
    }

    reporter.writeRecords([
      {
        time: format(Math.floor(addMinutes(now, -1).getTime() / 60000) * 60000, 'MM-dd HH:mm'),
        ...prices,
      },
    ])
  } catch (error) {
    logger.error(error)
  }

  reportedAt = now
}
