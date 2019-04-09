from modules import settings

SDR_BUDGET = settings['SDR_BUDGET']


def make_pairs(code: str):
    keys = list(SDR_BUDGET.keys())
    if code in keys:
        keys.remove(code)

    return ["%s%s" %(code, key) for key in keys]


def calc_sdr_rate(currency_rate):
    rate = 0
    for k, v in currency_rate.items():
        rate += SDR_BUDGET[k] * currency_rate[k]

    return rate

