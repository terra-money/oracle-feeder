from weightedstats import weighted_median
from typing import Dict, List

import ccxt

from modules.exchange import Price
from modules.settings import settings
from .coinone import coinone
from .gopax import gopax

EXCHANGE = settings.get('EXCHANGE', {
    "BLACKLIST": [],
    "WHITELIST": [],
    "WEIGHT": {},
})

EXCHANGE_BLACKLIST = EXCHANGE.get('BLACKLIST', [])
EXCHANGE_WHITELIST = EXCHANGE.get('WHITELIST', None)
WEIGHT = EXCHANGE.get('WEIGHT', {})

DENOM = settings['UPDATER']['DENOM']

# Inserting lite implementation of gopax API to ccxt
setattr(ccxt, "gopax", gopax)
ccxt.exchanges.append("gopax")

# replace coinone exchange with custom lite implementation to support LUNA/KRW pair
setattr(ccxt, "coinone", coinone)


# noinspection PyBroadException
def filter_exchanges(currencies, exchanges) -> Dict[str, List[ccxt.Exchange]]:
    """
    filtering exchanges, has fetch_ticker for luna/currency
    :return:
    filtered exchanges
    """

    exchange_map: Dict[str, List[ccxt.Exchange]] = {}

    for currency in currencies:
        symbol = f"{DENOM}/{currency}"
        exchange_map[symbol] = []

    print("#### CHECKING EXCHANGES ####")

    for exchange_id in exchanges:
        print(f"- Checking '{exchange_id}' ")

        if exchange_id in EXCHANGE_BLACKLIST:
            continue

        try:
            exchange = getattr(ccxt, exchange_id)()
            markets = exchange.fetch_markets()
            if type(markets) == dict:
                markets = list(markets.values())

            if len(markets) == 0 or type(markets) != list or type(markets[0]) != dict:
                print(f"Internal Error: Markets '{markets}' type mismatched on '{exchange_id}'")
                raise TypeError

            for market in markets:
                if 'symbol' not in market:
                    print(f"Internal Error: Market '{market}' type mismatched on '{exchange_id}''")
                    raise TypeError

                symbol = market['symbol']
                if symbol in exchange_map and hasattr(exchange, 'fetch_ticker'):
                    exchange_map[symbol].append(exchange)

        except Exception:
            pass

    return exchange_map


def get_prices_data(exchanges: Dict[str, List[ccxt.Exchange]], sdr_rates, currencies) -> List[Price]:
    """
    fetch add exchanges and calulcating additional values.
    :param exchanges: ccxt exchange object list to query
    :param sdr_rates: sdr rate information
    :param currencies: currencies ticker names to get
    :return: price list dictionary
    """
    sdr_price = fetch_all_exchanges(exchanges, sdr_rates, currencies)

    if not sdr_price:  # in case of no data fetched
        return []

    # fill prices
    prices: List[float] = []
    for currency in currencies:
        if currency == 'SDR':
            prices.append(Price(currency, sdr_price))
            continue

        sdr_rate = sdr_rates.get(currency, 0)
        if sdr_rate:
            prices.append(Price(currency, (sdr_price / sdr_rate)))

    return prices


def fetch_all_exchanges(exchanges: Dict[str, List[ccxt.Exchange]], sdr_rates: Dict[str, float],
                        currencies: List[str]) -> (List[float]):
    sdr_prices: List[float] = []

    success_count = 0
    failed_exchanges: List[str] = []

    print("\n\n###### FETCHING PRICES ######")
    for currency in currencies:
        sdr_rate = sdr_rates.get(currency, 0)
        if not sdr_rate:
            continue

        print(f"\n- Currency '{currency}'")

        symbol = f"{DENOM}/{currency}"
        weights: List[float] = []

        for exchange in exchanges[symbol]:
            print(f"Updating from '{exchange.id}'")

            # noinspection PyBroadException
            try:
                # Load latest price
                last = float(exchange.fetch_ticker(symbol)['last'])
                sdr_prices.append(last * sdr_rate)

                # Set weight for the fetched price (default weight is 1)
                if exchange.id in WEIGHT:
                    weights.append(WEIGHT[exchange.id])
                else:
                    weights.append(1)

                success_count += 1

            except Exception:
                failed_exchanges.append("%s(%s)" % (exchange.id, symbol))

    # calculate LUNA/SDR price
    sdr_price: float = 0

    if len(sdr_prices) == 0:
        sdr_price = 0
    elif len(weights) == 0:
        sdr_price = sdr_prices[0]
    else:
        sdr_price = weighted_median(sdr_prices, weights=weights)

    # result logging
    print(f"\nSuccess: {success_count}, Fail: {len(failed_exchanges)} [{failed_exchanges}]")

    return sdr_price
