from statistics import median
from typing import Dict, List

import ccxt
import tqdm

from modules.exchange import Price
from modules.settings import settings
from .coinone import coinone
from .gopax import gopax

EXCHANGE = settings.get('EXCHANGE', {
    "BLACKLIST": [],
    "WHITELIST": [],
})

EXCHANGE_BLACKLIST = EXCHANGE.get('BLACKLIST', [])
EXCHANGE_WHITELIST = EXCHANGE.get('WHITELIST', None)

DENOM = settings['UPDATER']['DENOM']

# Inserting lite implementation of gopax API to ccxt
setattr(ccxt, "gopax", gopax)
ccxt.exchanges.append("gopax")

# replace coinone exchange with custom lite implementation to support LUNA/KRW pair
setattr(ccxt, "coinone", coinone)


# noinspection PyBroadException
def filter_exchanges(currencies, from_exchanges) -> Dict[str, List[ccxt.Exchange]]:
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

    exchange_tqdm = tqdm.tqdm(from_exchanges, "Checking available exchanges", disable=None)
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

        except Exception:
            pass

    return exchanges


def get_prices_data(exchanges: Dict[str, List[ccxt.Exchange]], sdr_rates, currencies) -> List[Price]:
    """
    fetch add exchanges and calulcating additional values.
    :param exchanges: ccxt exchange object list to query
    :param sdr_rates: sdr rate information
    :param currencies: currencies ticker names to get
    :return: price list dictionary
    """
    prices, sdr_prices, unfetched_currencies = fetch_all_exchanges(exchanges, sdr_rates, currencies)

    if not sdr_prices:  # in case of no data fetched
        return []

    # calculate LUNA/SDR price
    sdr_price = median(sdr_prices)
    prices.append(Price("SDR", sdr_price, dispersion=0))

    # fill unfetched prices in
    for currency in unfetched_currencies:
        sdr_rate = sdr_rates[currency]
        prices.append(Price(currency, (sdr_price / sdr_rate)))

    # calc. dispersion
    for price in prices:
        if price.currency == "SDR":
            continue

        sdr_rate = sdr_rates[price.currency]
        price.dispersion = 1 - ((sdr_price - (1 / price.raw_price / sdr_rate)) / sdr_price)

    return prices


def fetch_all_exchanges(exchanges: Dict[str, List[ccxt.Exchange]], sdr_rates: Dict[str, float],
                        currencies: List[str]) -> (List[float]):
    prices: List[Price] = []
    sdr_prices: List[float] = []

    unfetched_currencies: List[str] = []

    success_count = 0
    failed_exchanges: List[str] = []

    currency_tqdm = tqdm.tqdm(currencies, "Fetching", disable=None)
    for currency in currency_tqdm:
        currency_tqdm.set_description_str(f"Currency '{currency}'")

        symbol = f"{DENOM}/{currency}"
        values: List[float] = []

        sdr_rate = sdr_rates.get(currency, 0)

        exchange_tqdm = tqdm.tqdm(exchanges[symbol], disable=None)
        for exchange in exchange_tqdm:
            exchange_tqdm.set_description_str(f"Updating from '{exchange.id}'")

            # noinspection PyBroadException
            try:
                last = float(exchange.fetch_ticker(symbol)['last'])
                values.append(last)  # LUNA/CURRENCY <=> CURRENCY/LUNA

                if sdr_rate:
                    sdr_prices.append(last * sdr_rate)

                success_count += 1

            except Exception:
                failed_exchanges.append("%s(%s)" % (exchange.id, symbol))

        if values:
            prices.append(Price(currency, median(values)))
        else:
            unfetched_currencies.append(currency)

    # result logging
    print("")
    print(f"Success: {success_count}, Fail: {len(failed_exchanges)} [{failed_exchanges}]")

    return prices, sdr_prices, unfetched_currencies
