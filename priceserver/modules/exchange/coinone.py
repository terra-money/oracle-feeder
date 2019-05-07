import requests

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
        denom = symbol.split("/")[0]
        return requests.get(COINONE_SERVER + f"/ticker/?currency={denom}").json()
