from typing import Dict, List

import requests
import csv


SDR_RATE_URL = "https://www.imf.org/external/np/fin/data/rms_five.aspx?tsvflag=Y"

SDR_CURRENCY_CODE_MAP = {
    # major currencies
    "U.S. dollar": "USD",
    "U.K. pound": "GBP",
    "Euro": "EUR",
    "Japanese yen": "JPY",
    "Korean won": "KRW",
    "Chinese yuan": "CNY",

    # minor currencies
    "Algerian dinar": "DZD",
    "Australian dollar": "AUD",
    "Botswana pula": "BWP",
    "Brazilian real": "BRL",
    "Brunei dollar": "BND",
    "Canadian dollar": "CAD",
    "Chilean peso": "CLP",
    "Colombian peso": "COP",
    "Czech koruna": "CZK",
    "Danish krone": "DKK",
    "Indian rupee": "INR",
    "Israeli New Shekel": "ILS",
    "Kuwaiti dinar": "KWD",
    "Malaysian ringgit": "MYR",
    "Mauritian rupee": "MUR",
    "Mexican peso": "MXN",
    "New Zealand dollar": "NZD",
    "Norwegian krone": "NOK",
    "Omani rial": "OMR",
    "Peruvian sol": "PEN",
    "Philippine peso": "PHP",
    "Polish zloty": "PLN",
    "Qatari riyal": "QAR",
    "Russian ruble": "RUB",
    "Saudi Arabian riyal": "SAR",
    "Singapore dollar": "SGD",
    "South African rand": "ZAR",
    "Swedish krona": "SEK",
    "Swiss franc": "CHF",
    "Thai baht": "THB",
    "Trinidadian dollar": "TTD",
    "U.A.E. dirham": "AED",
    "Uruguayan peso": "UYU"
}


def get_sdr_rates(currency_list: List[str]) -> Dict[str, float]:
    tsv = get_tsv()
    rates = parse_imf_tsv(tsv, currency_list)

    return rates


def get_tsv():
    return requests.get(SDR_RATE_URL).text


def parse_imf_tsv(tsv: str, currency_list: List[str]):
    reader = csv.reader(tsv.splitlines(), delimiter='\t')

    rates = {}
    for row in reader:
        if row and row[0] == 'Currency units per SDR(3)':
            break

        if len(row) < 6:
            continue

        currency = row[0]
        rate = row[1] or row[2] or row[3] or row[4] or row[5]

        if currency in SDR_CURRENCY_CODE_MAP:
            code = SDR_CURRENCY_CODE_MAP[currency]
            if code in currency_list:
                rates[code] = float(rate)

    return rates