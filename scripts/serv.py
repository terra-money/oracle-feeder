import json
import threading
from flask import Flask

from .modules.cutlet import get_data

app = Flask(__name__)
data = []


def periodic_update():
    global data
    print("Updating...")
    data = get_data()
    print("Updated!")
    print(json.dumps(data))

    threading.Timer(60, periodic_update).start()


periodic_update()


@app.route("/last")
def last_price():
    global data
    return json.dumps(data)
