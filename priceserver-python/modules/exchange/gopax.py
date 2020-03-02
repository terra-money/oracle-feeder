import requests

GOPAX_SERVER = "https://api.gopax.co.kr"


class gopax:
    id = "gopax"

    def fetch_markets(self):
        pairs = requests.get(GOPAX_SERVER + "/trading-pairs").json()

        markets = []
        for pair in pairs:
            markets.append({
                "id": pair["id"],
                "symbol": pair["name"].replace("-", "/"),
                "base": pair["baseAsset"],
                "quote": pair["quoteAsset"]
            })

        return markets

    def fetch_ticker(self, symbol):
        ticker = requests.get(GOPAX_SERVER + "/trading-pairs/%s/trades" % symbol.replace("/", "-")).json()

        return {
            "last": ticker[0]["price"]
        }
