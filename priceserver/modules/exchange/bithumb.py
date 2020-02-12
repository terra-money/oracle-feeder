import requests
from datetime import datetime
from modules.settings import settings
from modules.moving_average import MovingAverage
from time import time

MOVING_AVG_SPAN = settings['UPDATER'].get('MOVING_AVG_SPAN', 3 * 60 * 1000)
API_URL = 'https://api.bithumb.com/public'

data = {
  'coinType': 'C0534',
  'crncCd': 'C0100',
  'tickType': '01M',
  'csrf_xcoin_name': 'd2e131dccab300919c9fafcec567bb51'
}

cookies = {
  'csrf_xcoin_name': 'd2e131dccab300919c9fafcec567bb51'
}

headers = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest'
}

class bithumb:
    id = 'bithumb'

    def fetch_markets(self):
        pairs = requests.get(API_URL + '/ticker/all_krw').json()['data']
        markets = []

        for key, _ in pairs.items():
            if key.isupper():
                markets.append({
                    'id': key.lower(),
                    'symbol': f'{key}/KRW',
                    'base': key.lower(),
                    'quote': 'KRW'
                })

        return markets

    def fetch_ticker(self, symbol: str):
        #denom = symbol.split('/')[0]
        result = requests.post(F'https://www.bithumb.com/trade_history/chart_data?_={int(time() * 1000)}', headers=headers, cookies=cookies, data=data).json()

        ma = MovingAverage()
        volume = 0

        if result['error'] == '0000':
            for row in result['data']:
                # the order is [time, open, close, high, low, volume]
                if time() * 1000 - row[0] < MOVING_AVG_SPAN:
                    volume += float(row[5])
                    ma.append((float(row[3]) + float(row[2])) / 2)

        return {
            'last': ma.get_price(),
            'volume': volume
        }
