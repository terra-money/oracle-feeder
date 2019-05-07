import json
from flask import Flask

from modules.exchange import PriceEncoder
from .modules.updater import Updater

print("# Terra price server --------------------------")

app = Flask(__name__)

updater = Updater()


@app.route("/last")
@app.route("/latest")
def last_price():
    return json.dumps(updater.get_last_price(), cls=PriceEncoder)


if __name__ == '__main__':
    app.run(threaded=False, processes=1)
