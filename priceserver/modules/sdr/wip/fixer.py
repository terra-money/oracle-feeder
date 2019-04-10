import json
import requests
from typing import Dict

from modules import settings

FIXER_API_KEY = settings['FIXER_API_KEY']


def get_sdr_rates() -> Dict[str, float]:
    params = {
        "base": "XDR",
        "api_key": FIXER_API_KEY
    }
    print(json.dumps(params))

    quotes = requests.get("http://data.fixer.io/api/latest", params=params).json()
    return quotes['rates']


if __name__ == '__main__':
    print(get_sdr_rates())
