from modules.settings import settings
from importlib import import_module
from datetime import datetime, timedelta
from statistics import median

KEY_MAP = {
    "CURRENCYLAYER": "clayer",
    "OANDA": "oanda",
    "FIXER": "fixer",
    "IMF": "imf"
}

AVAILABLE_FOREXS = []

for forex in settings['FOREX']:
    name = forex['NAME']

    module_name = KEY_MAP.get(name)
    if not module_name:
        continue

    forex['API'] = import_module('.' + module_name, package=__name__)
    AVAILABLE_FOREXS.append(forex)

def get_sdr_rates(currencies):

    print(f"####### UPDATED FOREX #######")
    for forex in AVAILABLE_FOREXS:
        if 'SDR_RATES' in forex and 'LAST_UPDATED_TIME' in forex:
            if datetime.now() - timedelta(seconds=forex['INTERVAL']) <= forex['LAST_UPDATED_TIME']:
                continue

        try:
            sdr_rates = []
            if 'API_KEY' in forex:
                sdr_rates = forex['API'].get_sdr_rates(currencies, forex['API_KEY'])
            else:
                sdr_rates = forex['API'].get_sdr_rates(currencies)

            forex['SDR_RATES'] = sdr_rates
            forex['LAST_UPDATED_TIME'] = datetime.now()
            print(forex['NAME'])
            
        except Exception as e:
            # Delete failed exchange rate
            if 'SDR_RATES' in forex:
                del forex['SDR_RATES']
            if 'LAST_UPDATED_TIME' in forex:
                del forex['LAST_UPDATED_TIME']

            print(f"> Error on currency rate API {forex['NAME']}. Fallback :", e)

    # Build currency map
    currency_map = {}
    for currency in currencies:
        currency_map[currency] = []

    # Fill currency map with retrieved rates from the exchanges
    for forex in AVAILABLE_FOREXS:
        if 'SDR_RATES' not in forex:
            continue

        sdr_rates = forex['SDR_RATES']
        for currency, value in sdr_rates.items():
            currency_map[currency].append(value)
    
    # Compute medians
    sdr_rates = {}
    for currency, rates in currency_map.items():

        # Set SDR rates as 1
        if currency == 'SDR':
            sdr_rates[currency] = 1
            continue

        sdr_rates[currency] = median(rates)

    print("\n\n######## SDR RATES ##########")
    for c, r in sdr_rates.items():
        print(f"{c}: {r}")

    return sdr_rates
