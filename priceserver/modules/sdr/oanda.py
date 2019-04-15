"""
API client for OANDA
"""
import requests
from typing import Dict, List

from modules.sdr.utils import calc_sdr_rate
from modules.settings import settings

SDR_BUDGET = settings['SDR_BUDGET']
API_KEY = settings['API_KEYS']['OANDA']
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


def get_sdr_rates(currency_list: List[str]) -> Dict[str, float]:

    quotes = get_spot(currency_list)
    currency_rates = refine_rates(quotes)
    sdr_rates = calc_sdr_rates(currency_rates)

    return sdr_rates


def get_spot(currency_list: List[str]):
    currency_set = set(list(SDR_BUDGET.keys()) + currency_list)

    params = {
        "data_set": "OANDA",
        "base": currency_set,
        "api_key": API_KEY,
        "quote": currency_set
    }

    return requests.get(ENTRY_POINT + "rates/spot.json", params=params).json()


def refine_rates(quotes):
    currency_rates = {}

    for q in quotes['quotes']:
        base = q['base_currency']
        cur = q['quote_currency']
        price = q['midpoint']

        if cur in currency_rates:
            currency_rates[cur][base] = float(price)
        else:
            currency_rates[cur] = {base: float(price)}

    return currency_rates


def calc_sdr_rates(currency_rates):

    sdr_rates = {}
    for k, c in currency_rates.items():
        sdr_rates[k] = 1 / calc_sdr_rate(c)

    return sdr_rates
