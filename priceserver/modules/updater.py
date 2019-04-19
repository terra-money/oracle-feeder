import datetime
import threading

import pytz

from modules.exchange.ccxt import filter_exchanges, get_data
from modules.settings import settings

from modules.sdr import oanda
from modules.sdr import clayer
from modules.sdr import imf

data = {
    "created_at": "",
    "prices": ""
}

exchanges = []


def init_data():
    global data, exchanges

    currencies = settings['UPDATER']['CURRENCIES']
    exchanges = filter_exchanges(currencies)

    for symbol, exchange in exchanges.items():
        print(f"{symbol} : {len(exchange)} exchanges [{[e.id for e in exchange]}]")


def get_last_price():
    return data


def periodic_update():
    global data, exchanges
    print("Updating...")

    currencies = settings['UPDATER']['CURRENCIES']
    sdr_rates = None

    try:
        sdr_rates = oanda.get_sdr_rates(currencies)
    except Exception as e:
        print("Error on primary currency rate API. Fallback", e)

    if not sdr_rates:
        try:
            sdr_rates = clayer.get_sdr_rates(currencies)
        except Exception as e:
            print("Error on backup currency rate API. Fallback again", e)

    if not sdr_rates:
        try:
            sdr_rates = imf.get_sdr_rates(currencies)
        except Exception as e:
            print("Error on secondary backup currency rate API. Updating failed", e)

    if sdr_rates:
        data['prices'] = get_data(exchanges, sdr_rates, currencies)
        data['created_at'] = datetime.datetime.utcnow().replace(tzinfo=pytz.utc).isoformat()

        print("Updated! at ", data['created_at'])

        for price in data['prices']:
            price['price'] = format(price['price'], ".18f")  # cut data to limit precision to 18
            print("{currency} : {price} ({dispersion:.4f})".format(**price))

    threading.Timer(60, periodic_update).start()

