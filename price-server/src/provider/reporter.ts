import * as config from 'config'
import { reduce } from 'lodash'
import { format, isSameDay, isSameMinute, addMinutes } from 'date-fns'
import * as logger from 'lib/logger'
import { createReporter } from 'lib/reporter'
import { getLunaPrices } from 'prices'

let reporter
let reportedAt = Date.now()

export function report(now: number): void {
  if (isSameMinute(now, reportedAt)) {
    return
  }

  try {
    const lunaPrices = reduce(
      getLunaPrices(),
      (result, value, key) => Object.assign(result, { [key]: value.toFixed(18) }),
      {}
    )
    // lunaPrices['USDT/KRW'] = getUsdtToKrwRate()?.toFixed(18) || ''
    // lunaPrices['BTC Premium'] = getBtcPremium()?.toFixed(18) || ''

    logger.info(lunaPrices)

    if (!config.report) {
      reportedAt = now
      return
    }

    if (!reporter || !isSameDay(now, reportedAt)) {
      reporter = createReporter(`report/LunaPrices_${format(now, 'MM-dd_HHmm')}.csv`, [
        'time',
        ...Object.keys(lunaPrices).map((quote) => quote),
      ])
    }

    reporter.writeRecords([
      {
        time: format(Math.floor(addMinutes(now, -1).getTime() / 60000) * 60000, 'MM-dd HH:mm'),
        ...lunaPrices,
      },
    ])
  } catch (error) {
    logger.error(error)
  }

  reportedAt = now
}
