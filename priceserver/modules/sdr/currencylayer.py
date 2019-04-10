import requests

from typing import Dict
from modules import settings

CL_ACCESS_KEY = settings['CURRENCYLAYER_API_KEY']
CL_ENDPOINT = "https://apilayer.net/api/live"

latest = None


def get_sdr_rates(currencies) -> Dict[str, float]:
    global latest

    rates = {}
    url = f"{CL_ENDPOINT}?access_key={CL_ACCESS_KEY}&source=XDR&currencies={','.join(currencies)}"
    try:
        res = requests.get(url).json()
        if not res["success"]:
            raise RuntimeError

        for quote, rate in res["quotes"].items():
            code = quote[3:]
            rates[code] = 1/float(rate)

    except requests.exceptions.BaseHTTPError:
        if not latest:
            raise RuntimeError

        return latest

    latest = rates
    return rates
