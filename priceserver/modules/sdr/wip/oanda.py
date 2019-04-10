import json
import requests
from typing import Dict

# from modules.setting import OANDA_API_KEY
from modules.sdr_util import calc_sdr_rate
from modules import settings

SDR_BUDGET = settings['SDR_BUDGET']
OANDA_API_KEY = settings['OANDA_API_KEY']
ENTRY_POINT = "https://web-services.oanda.com/rates/api/v2/"

"""
DATASET CODE

OANDA – Rates obtained and aggregated by OANDA Corporation
EUCB – European Central Bank rates
ALCB – Bank of Albania rates
ANCB – Central Bank of Curacao and Sint Maarten rates
AUCB – Reserve Bank of Australia rates
BGCB – Bulgarian National Bank rates
BRCB – Banco Central do Brasil rates
CACB – Bank of Canada rates
CZCB – Czech National Bank rates
DKCB – Danmarks Nationalbank rates
GHCB – Bank of Ghana rates
GYCB – Bank Of Guyana rates
HKCB – Treasury Market Association, Hong Kong rates
HRCB – Croatian National Bank rates
HUCB – Hungarian National Bank rates
IDCB – Bank of Indonesia rates
INCB – Reserve Bank of India rates
ISCB – Central Bank of Iceland rates
MXCB – Banco de Mexico rates
MYCB – Bank Negara Malaysia rates
NOCB – Norges Bank rates
PKCB – State Bank of Pakistan rates
PLCB – Narodowy Bank Polski rates
RSCB – National Bank of Serbia rates
VECB-DICOM – The Banco Central de Venezuela rates
VNCB – The State Bank of Vietnam rates
"""


def get_sdr_rates() -> Dict[str, float]:
    params = {
        "data_set": "OANDA",
        "base": list(SDR_BUDGET.keys()),
        "api_key": OANDA_API_KEY,
        "quote": list(SDR_BUDGET.keys())
    }

    quotes = requests.get(ENTRY_POINT+"rates/spot.json", params=params).json()

    currency_rates = {}
    for q in quotes['quotes']:
        base = q['base_currency']
        cur = q['quote_currency']
        price = q['midpoint']
        print(q)

        if cur in currency_rates:
            currency_rates[cur][base] = float(price)
        else:
            currency_rates[cur] = {base: float(price)}

    sdr_rates = {}
    for k, c in currency_rates.items():
        sdr_rates[k] = calc_sdr_rate(c)

    return sdr_rates


if __name__ == '__main__':
    print(get_sdr_rates())
