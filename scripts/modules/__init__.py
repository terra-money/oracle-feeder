import datetime
import json
import threading
import pytz

from modules.exchange import get_data, filter_exchanges

data = {
    "created_at": "",
    "prices": ""
}

settings = {}
exchanges = []


def init_data():
    global data, settings, exchanges

    exchanges = filter_exchanges()

    with open('setting.json', 'r') as f:
        global settings
        settings = json.load(f)

    for symbol, exchange in exchanges.items():
        print(f"{symbol} : {len(exchange)} exchanges")


def periodic_update():
    global data, exchanges
    print("Updating...")

    data['prices'] = get_data(exchanges)
    data['created_at'] = datetime.datetime.utcnow().replace(tzinfo=pytz.utc).isoformat()

    print("Updated! at ", data['created_at'])

    for price in data['prices']:
        price['price'] = format(price['price'], ".18f")  # cut data to limit precision to 18
        print(price['currency'], " : ", price['price'])

    threading.Timer(60, periodic_update).start()


init_data()
