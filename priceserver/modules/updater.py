import datetime
import threading
from typing import Dict, List, Union

import ccxt
import pytz

from modules.exchange.ccxt import filter_exchanges, get_prices_data, EXCHANGE_WHITELIST
from modules.exchange import Price
from modules.settings import settings
from modules import sdr

UPDATING_PERIOD = settings['UPDATER'].get("PERIOD", 30)
EXCHANGE_REFRESH = settings['UPDATER'].get("EXCHANGE_REFRESH", 0)
TARGET_CURRENCIES = settings['UPDATER']['CURRENCIES']

class Updater:
    data = {
        "created_at": "",
        "prices": []
    }

    exchanges = Dict[str, List[ccxt.Exchange]]
    exchange_updated: datetime.datetime

    #moving_avg_prices: Dict[str, MovingAvgPrice] = {}

    def __init__(self):
        """ initial update """
        from_exchanges = EXCHANGE_WHITELIST # or ccxt.exchanges
        self.update_exchange(from_exchanges)
        self.periodic_task()

    def get_last_price(self):
        return self.data

    def periodic_task(self):
        self.update_data()
        threading.Timer(UPDATING_PERIOD, self.periodic_task).start()

    def update_exchange(self, from_exchanges):
        self.exchange_updated = datetime.datetime.utcnow()

        from_exchanges = list(set(from_exchanges))
        self.exchanges = filter_exchanges(TARGET_CURRENCIES, from_exchanges)

        for symbol, exchange in self.exchanges.items():
            print(f"{symbol} : {len(exchange)} exchanges [{[e.id for e in exchange]}]")

    def update_data(self):
        print("\n# Updating...")

        # periodic exchange filtering
        if EXCHANGE_REFRESH and datetime.datetime.utcnow() - self.exchange_updated >= datetime.timedelta(seconds=EXCHANGE_REFRESH):
            self.update_exchange(ccxt.exchanges)

        # fetching exchange rates
        currencies = settings['UPDATER']['CURRENCIES']
        sdr_rates = sdr.get_exchange_rates(currencies)

        # fetching price data
        prices = get_prices_data(self.exchanges, sdr_rates, currencies)

        if not prices:
            print("Updating failed!")
            return
        
        self.data = {
            'prices': prices,
            'created_at': datetime.datetime.utcnow().replace(tzinfo=pytz.utc).isoformat()
        }

        # printing logs
        for price in self.data['prices']:
            print(f"{price.currency} : {price.price}")

        print(f"Updated! at {self.data['created_at']}")
