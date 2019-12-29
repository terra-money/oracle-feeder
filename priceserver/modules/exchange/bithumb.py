import requests
from datetime import datetime
from modules.settings import settings
from modules.moving_average import MovingAverage
from time import time

MOVING_AVG_SPAN = settings['UPDATER'].get("MOVING_AVG_SPAN", 3 * 60 * 1000)
API_URL = "https://api.bithumb.com/public"

class bithumb:
    id = "bithumb"

    def __init__(self):
        self.ma = MovingAverage()
        
    def fetch_markets(self):
        pairs = requests.get(API_URL + "/ticker/all_krw").json()["data"]
        markets = []

        for key, _ in pairs.items():
            if key.isupper():
                markets.append({
                    "id": key.lower(),
                    "symbol": f"{key}/KRW",
                    "base": key.lower(),
                    "quote": "KRW"
                })

        return markets

    def fetch_ticker(self, symbol: str):
        #denom = symbol.split("/")[0]
        result = requests.get(API_URL + f"/transaction_history/{symbol}_krw?count=100").json()
        last_min = 0
        price = None

        if len(self.ma.prices) != 0:
            last_min = self.ma.times[-1]

        for row in result["data"]:
            row_min = int(datetime.strptime(row["transaction_date"], "%Y-%m-%d %H:%M:%S").timestamp() / 60)

            if row_min > last_min:
                print("bithumb:", row["transaction_date"], row["price"])
                price = float(row["price"])
                self.ma.append(price, row_min)
                last_min = row_min

        # Append latest price if there was no transaction
        if price is None:
            self.ma.append(self.ma.prices[-1])

        # if MOVING_AVG_SPAN is 1800000 (3 mins) and PERIOD is 30 secs, slice list size to 60
        self.ma.slice(int((MOVING_AVG_SPAN / 60000) * (60 / settings['UPDATER'].get("PERIOD"))))
        print("bithumb:", self.ma.get_price())

        return {
            "last": self.ma.get_price()
        }
