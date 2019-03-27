from typing import Dict

import requests
import csv


SDR_RATE_URL = "https://www.imf.org/external/np/fin/data/rms_five.aspx?tsvflag=Y"


SDR_CURRENCY_CODE_MAP = {
    "U.S. dollar": "USD",
    "Euro": "EUR",
    "Japanese yen": "JPY",
    "Korean won": "KRW",
    "Chinese yuan": "CHY"
}


def get_sdr_rates() -> Dict[str, float]:
    rates = {}
    tsv = requests.get(SDR_RATE_URL).text
    reader = csv.reader(tsv.splitlines(), delimiter='\t')
    for row in reader:
        if row and row[0] == 'Currency units per SDR(3)':
            break

        if len(row) < 6:
            continue

        currency = row[0]
        rate = row[1] or row[2] or row[3] or row[4] or row[5]

        if currency in SDR_CURRENCY_CODE_MAP:
            code = SDR_CURRENCY_CODE_MAP[currency]
            rates[code] = float(rate)

    return rates
