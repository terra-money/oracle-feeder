import requests
from datetime import datetime
from modules.settings import settings
from modules.moving_average import MovingAverage
from time import time

MOVING_AVG_SPAN = settings['UPDATER'].get("MOVING_AVG_SPAN", 30 * 60 * 1000)
COINONE_SERVER = "https://api.coinone.co.kr"

class coinone:
    id = "coinone"

    def fetch_markets(self):
        pairs = requests.get(COINONE_SERVER + "/ticker/?currency=_").json()

        markets = []
        for denom, data in pairs.items():
            markets.append({
                "id": denom,
                "symbol": f"{denom}/KRW".upper(),
                "base": denom,
                "quote": "KRW"
            })

        return markets

    def fetch_ticker(self, symbol: str):
        #denom = symbol.split("/")[0]
        #return requests.get(COINONE_SERVER + f"/ticker/?currency={denom}").json()
        result = requests.get('https://tb.coinone.co.kr/api/v1/chart/olhc/?site=coinoneluna&type=1m').json()
        ma = MovingAverage()

        for row in result['data']:
            if (time() * 1000 - int(row['DT'])) < MOVING_AVG_SPAN:
                ma.append((float(row['Low']) + float(row['High'])) / 2)

        return {
            "last": ma.get_price()
        }
