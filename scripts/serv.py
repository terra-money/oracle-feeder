import json
import threading
from flask import Flask

from modules.cutlet import get_data, filter_exchanges

app = Flask(__name__)
data = []

exchanges = filter_exchanges()

for symbol, exchange in exchanges.items():
    print(f"{symbol} : {len(exchange)} exchanges")


def periodic_update():
    global data
    print("Updating...")
    data = get_data(exchanges)
    print("Updated!")
    print(json.dumps(data))

    threading.Timer(60, periodic_update).start()


periodic_update()


@app.route("/last")
def last_price():
    global data
    return json.dumps(data)
