"""
API client for currency layer
"""
import requests

from typing import Dict, List
from modules.settings import settings

CL_ACCESS_KEY = settings['API_KEYS']['CURRENCYLAYER']
CL_ENDPOINT = "https://apilayer.net/api/live"


def get_sdr_rates(currencies) -> Dict[str, float]:
    res = get_spot(currencies)

    if not res["success"]:
        raise RuntimeError

    quotes = res["quotes"]
    rates = calc_rate(quotes)
    return rates


def get_spot(currencies: List[str]) -> Dict[str, any]:
    url = f"{CL_ENDPOINT}?access_key={CL_ACCESS_KEY}&source=XDR&currencies={','.join(currencies)}"
    return requests.get(url).json()


def calc_rate(quotes: Dict[str, float]) -> Dict[str, float]:
    rates = {}

    for quote, rate in quotes.items():
        code = quote[3:]
        rates[code] = 1/float(rate)

    return rates
