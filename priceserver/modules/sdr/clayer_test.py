import requests

from modules.sdr import clayer

API_RESULT = {
    "success": True,
    "terms": "https://currencylayer.com/terms",
    "privacy": "https://currencylayer.com/privacy",
    "timestamp": 1432400348,
    "source": "USD",
    "quotes": {
        "XDRAUD": 1.278342,
        "XDREUR": 1.278342,
        "XDRGBP": 0.908019,
        "XDRPLN": 3.731504
    }
}

XDR_RATE = {
    "AUD": 0.7822632754,
    "EUR": 0.7822632754,
    "GBP": 1.1012985411,
    "PLN": 0.2679884572
}


def test_clayer():
    currencies = ['KRW', 'USD']
    res = clayer.get_spot(currencies)

    assert res["success"]
    assert res["source"] == "XDR"
    assert len(res["quotes"]) == len(currencies)

    rates = clayer.calc_rate(API_RESULT['quotes'])
    assert rates == XDR_RATE
