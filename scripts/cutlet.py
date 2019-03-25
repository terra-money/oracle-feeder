import json
import sys
from statistics import median
from typing import Dict

from ccxt import ExchangeError

import ccxt

import sdr

CHECKING_EXCHANGES = ['coinone', 'bithumb', 'upbit', 'coinex', 'binance', 'bitfinex', 'bittrex', 'kraken', 'kucoin',
                      'theocean']
CHECKING_CURRENCIES = ['KRW', 'USD', 'CHY', 'JPY', 'EUR']

LUNA_DENOM = "ETH"


# ------------------------------------------------------------------------------

def get_exchanges():
    exchanges: Dict[str, ccxt.Exchange] = {}

    for id in CHECKING_EXCHANGES:
        exchange = getattr(ccxt, id)
        exchange_config = {}
        if sys.version_info[0] < 3:
            exchange_config.update({'enableRateLimit': True})
        exchanges[id] = exchange(exchange_config)

    return exchanges


def get_data():
    sdr_rates = sdr.get_sdr_rates()
    exchanges = get_exchanges()

    result = []
    sdr_result = []

    for currency in CHECKING_CURRENCIES:
        symbol = f"{LUNA_DENOM}/{currency}"
        values = []

        sdr_rate = sdr_rates.get(currency, 0)

        for ex_code, exchange in exchanges.items():
            try:
                last = exchange.fetch_ticker(symbol).get('last', 0)
                values.append(1/last)  # LUNA/CURRENCY <=> CURRENCY/LUNA

                if sdr_rate:
                    sdr_result.append(1/(last * sdr_rate))

            except ExchangeError:
                pass
            except Exception as e:
                print(f"{symbol}/{ex_code}")
                raise e

        if values:
            result.append({
                "currency": currency,
                "price": median(values)
            })

    if sdr_result:
        result.append({
            "currency": "SDR",
            "price": median(sdr_result)
        })

    return result


# ------------------------------------------------------------------------------


def main():
    result = get_data()
    print(json.dumps(result))


# ------------------------------------------------------------------------------

if __name__ == '__main__':
    main()
