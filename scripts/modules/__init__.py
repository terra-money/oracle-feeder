import datetime
import threading
import pytz
import os

from modules.exchange import get_data, filter_exchanges

exchanges = filter_exchanges()

data = {
    "created_at": "",
    "prices": ""
}

for symbol, exchange in exchanges.items():
    print(f"{symbol} : {len(exchange)} exchanges")


def periodic_update():
    global data
    print("Updating...")

    data['prices'] = get_data(exchanges)
    data['created_at'] = datetime.datetime.utcnow().replace(tzinfo=pytz.utc).isoformat()

    print("Updated! at ", data['created_at'])
    for price in data['prices']:
        print(price['currency'], " : ", price['price'])

    threading.Timer(60, periodic_update).start()

