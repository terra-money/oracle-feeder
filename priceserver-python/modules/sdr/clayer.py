"""
API client for currency layer
"""
import requests

from typing import Dict, List

ENDPOINT = "https://apilayer.net/api/live"

def get_sdr_rates(currencies: List[str], api_key: str) -> Dict[str, float]:
    res = get_spot(currencies, api_key)

    if not res["success"]:
        raise RuntimeError

    quotes = res["quotes"]
    rates = calc_rate(quotes)
    return rates


def get_spot(currencies: List[str], api_key: str) -> Dict[str, any]:
    url = f"{ENDPOINT}?access_key={api_key}&source=XDR&currencies={','.join(currencies)}"
    return requests.get(url).json()


def calc_rate(quotes: Dict[str, float]) -> Dict[str, float]:
    rates = {}

    for quote, rate in quotes.items():
        code = quote[3:]
        rates[code] = 1/float(rate)

    return rates
