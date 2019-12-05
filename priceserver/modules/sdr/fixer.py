import json
import requests
from typing import List, Dict

ENDPOINT = "http://data.fixer.io/api/latest"

def get_sdr_rates(currencies: List[str], api_key: str) -> Dict[str, float]:
    params = {
        # "base": "XDR",
        "access_key": api_key,
        "symbols": ','.join(currencies) + ',XDR'
    }

    result = requests.get(ENDPOINT, params=params).json()
    if not result['success']:
        raise NameError(result['error'])

    return change_base(result['rates'])

def change_base(rates: Dict[str, float]):
    sdr_rate = rates['XDR']
    del rates['XDR']

    for currency in rates:
        rates[currency] = sdr_rate / rates[currency]

    return rates
