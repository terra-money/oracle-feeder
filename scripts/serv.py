import json
from flask import Flask

from modules import periodic_update, data

app = Flask(__name__)


@app.route("/last")
def last_price():
    return json.dumps(data)


periodic_update()

if __name__ == '__main__':
    app.run(threaded=False, processes=1)
