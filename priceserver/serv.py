import json
from flask import Flask

from .modules import updater

app = Flask(__name__)


@app.route("/last")
def last_price():
    return json.dumps(updater.get_last_price())


updater.init_data()
updater.periodic_update()

if __name__ == '__main__':
    app.run(threaded=False, processes=1)
