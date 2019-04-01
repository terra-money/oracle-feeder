import datetime
import json
import threading

import pytz as pytz
from flask import Flask

from modules.cutlet import get_data, filter_exchanges

app = Flask(__name__)
data = {
    "created_at": "",
    "prices": ""
}

exchanges = filter_exchanges()

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


periodic_update()


@app.route("/last")
def last_price():
    global data
    return json.dumps(data)
