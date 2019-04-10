import json
import requests

from modules import settings
from modules.sdr_util import make_pairs

SDR_BUDGET = settings['SDR_BUDGET']
ONEFORGE_API_KEY = settings['ONEFORGE_API_KEY']


def tset():
    pairs = make_pairs('USD')
    print(json.dumps(pairs))

    params = {
        "pairs": ",".join(pairs),
        "api_key": ONEFORGE_API_KEY
    }
    print(json.dumps(params))

    quotes = requests.get("https://forex.1forge.com/1.0.3/quotes", params=params).json()
    print(json.dumps(quotes))

    prices = {}
    for q in quotes:
        prices[q['symbol'][3:]] = q['price']

    prices['USD'] = 1
    print(json.dumps(prices))

    equivalents = {}
    for c, a in SDR_BUDGET.items():
        e = prices[c] * a
        equivalents[c] = e

    print(json.dumps(equivalents))


if __name__ == '__main__':
    tset()
