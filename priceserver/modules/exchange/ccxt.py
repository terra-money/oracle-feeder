import json
import os
import tqdm
import ccxt

from statistics import median
from typing import Dict, List

from ccxt import ExchangeError, ExchangeNotAvailable, DDoSProtection, BaseError, RequestTimeout, NetworkError
from modules.settings import settings

EXCHANGE_BLACKLIST = ['coingi', 'jubi', 'coinegg', 'theocean']
DENOM = settings['UPDATER']['DENOM']


# ------------------------------------------------------------------------------

def filter_exchanges(currencies) -> Dict[str, List[ccxt.Exchange]]:
    """
    filtering exchanges, has fetch_ticker for luna/currency
    :return:
    filtered exchanges
    """

    exchanges: Dict[str, List[ccxt.Exchange]] = {}

    for currency in currencies:
        symbol = f"{DENOM}/{currency}"
        exchanges[symbol] = []

    print("Checking available exchanges --")

    exchange_list = ccxt.exchanges
    if os.getenv("FLASK_DEBUG", False):
        exchange_list = exchange_list[:10]

    exchange_tqdm = tqdm.tqdm(exchange_list, "Checking available exchanges")
    for exchange_id in exchange_tqdm:
        exchange_tqdm.set_description_str(f"Checking '{exchange_id}' ")

        if exchange_id in EXCHANGE_BLACKLIST:
            continue

        exchange = getattr(ccxt, exchange_id)()
        try:
            markets = exchange.fetch_markets()
            if type(markets) == dict:
                markets = list(markets.values())

            if len(markets) == 0 or type(markets) != list or type(markets[0]) != dict:
                print(markets)
                print("Internal Error: Markets type mismatched on ", exchange_id)
                raise TypeError

            for market in markets:
                if 'symbol' not in market:
                    print(market)
                    print("Internal Error: Market type mismatched on ", exchange_id)
                    raise TypeError

                symbol = market['symbol']
                if symbol in exchanges and hasattr(exchange, 'fetch_ticker'):
                    exchanges[symbol].append(exchange)

        except (BaseError, AttributeError):
            pass

    return exchanges


v0 = [('fetched ', 'ETH/EUR', 146.57), ('fetched ', 'ETH/GBP', 126.85)]

v1 = [{'currency': 'EUR', 'price': 0.006822678583611927, 'dispersion': -0.29238255365693055},
      {'currency': 'GBP', 'price': 0.007883326763894364, 'dispersion': -0.2895953580960041},
      {'currency': 'SDR', 'price': 0.006488793839130121, 'dispersion': 0},
      {'currency': 'USD', 'price': 0.004665919996590282, 'dispersion': 1.3367071901065067e-16},
      {'currency': 'KRW', 'price': 4.1194950794272465e-06, 'dispersion': 0.0},
      {'currency': 'CNY', 'price': 0.0006957394211215282, 'dispersion': 0.0},
      {'currency': 'JPY', 'price': 4.1686422556553665e-05, 'dispersion': 0.0}]

v2 = [{'currency': 'EUR', 'price': 0.006822678583611927, 'dispersion': -0.29238255365693055},
      {'currency': 'GBP', 'price': 0.007883326763894364, 'dispersion': -0.2895953580960041},
      {'currency': 'SDR', 'price': 0.006488793839130121, 'dispersion': 0},
      {'currency': 'USD', 'price': 0.004665919996590282, 'dispersion': 1.3367071901065067e-16},
      {'currency': 'KRW', 'price': 4.1194950794272465e-06, 'dispersion': 0.0},
      {'currency': 'CNY', 'price': 0.0006957394211215282, 'dispersion': 0.0},
      {'currency': 'JPY', 'price': 4.1686422556553665e-05, 'dispersion': 0.0}]


def get_data(exchanges: Dict[str, List[ccxt.Exchange]], sdr_rates, currencies):
    result = []
    nodata = []

    sdr_result = []

    success_count = 0
    fail_count = 0

    currency_tqdm = tqdm.tqdm(currencies, "Fetching")
    for currency in currency_tqdm:
        currency_tqdm.set_description_str(f"Currency '{currency}'")

        symbol = f"{DENOM}/{currency}"
        values = []

        sdr_rate = sdr_rates.get(currency, 0)

        exchange_tqdm = tqdm.tqdm(exchanges[symbol])
        for exchange in exchange_tqdm:
            exchange_tqdm.set_description_str(f"Updating from '{exchange.id}'")

            try:
                last = exchange.fetch_ticker(symbol)['last']
                values.append(1 / last)  # LUNA/CURRENCY <=> CURRENCY/LUNA

                if sdr_rate:
                    sdr_result.append(last * sdr_rate)

                success_count += 1

            except Exception as e:
                fail_count += 1
                print(f"{symbol}/{exchange.id}")

        if values:
            result.append({
                "currency": currency,
                "price": median(values)
            })
        else:
            nodata.append(currency)

    if not sdr_result:
        return []

    # Post processing
    sdr_price = median(sdr_result)

    result.append({
        "currency": "SDR",
        "price": 1 / sdr_price
    })

    # fill-in
    for currency in nodata:
        sdr_rate = sdr_rates[currency]

        result.append({
            "currency": currency,
            "price": 1 / (sdr_price / sdr_rate)
        })

    # calc dispersion
    for item in result:
        if item['currency'] == "SDR":
            item['dispersion'] = 0
            continue

        sdr_rate = sdr_rates[item['currency']]
        item['dispersion'] = 1 - ((sdr_price - (item['price'] / sdr_rate)) / sdr_price)

    # Information printing
    print("")
    print(f"Success: {success_count}, Fail: {fail_count}")

    return result
