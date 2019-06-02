#from . import oanda
from . import clayer
from . import imf

AVAILABLE_EXCHANGE_RATE_APIS = [
    #oanda,
    clayer,
    imf
]


def get_exchange_rates(currencies):
    for idx, api in enumerate(AVAILABLE_EXCHANGE_RATE_APIS):
        try:
            return api.get_sdr_rates(currencies)
        except Exception as e:
            print(f"> Error on currency rate API #{idx+1}: {api.__name__}. Fallback :", e)

    print("> All APIs are not available. Updating failed!")
    return {}
