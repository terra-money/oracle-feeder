import json

from modules import settings
from modules.sdr import oanda

ORIGIN_DATA = {
    'meta': {
        'effective_params': {
            'data_set': 'OANDA',
            'base_currencies': ['CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'USD'],
            'quote_currencies': ['CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'USD']
        },
        'endpoint': 'spot',
        'request_time': '2019-04-15T10:00:24+00:00',
        'skipped_currency_pairs': []
    },
    'quotes': [
        {'base_currency': 'CNY', 'quote_currency': 'CNY', 'bid': '1.00000', 'ask': '1.00000', 'midpoint': '1.00000'},
        {'base_currency': 'CNY', 'quote_currency': 'EUR', 'bid': '0.131767', 'ask': '0.131812', 'midpoint': '0.131790'},
        {'base_currency': 'CNY', 'quote_currency': 'GBP', 'bid': '0.113794', 'ask': '0.113836', 'midpoint': '0.113815'},
        {'base_currency': 'CNY', 'quote_currency': 'JPY', 'bid': '16.6868', 'ask': '16.6926', 'midpoint': '16.6897'},
        {'base_currency': 'CNY', 'quote_currency': 'KRW', 'bid': '168.722', 'ask': '169.058', 'midpoint': '168.890'},
        {'base_currency': 'CNY', 'quote_currency': 'USD', 'bid': '0.149094', 'ask': '0.149128', 'midpoint': '0.149111'},
        {'base_currency': 'EUR', 'quote_currency': 'CNY', 'bid': '7.58657', 'ask': '7.58913', 'midpoint': '7.58785'},
        {'base_currency': 'EUR', 'quote_currency': 'EUR', 'bid': '1.00000', 'ask': '1.00000', 'midpoint': '1.00000'},
        {'base_currency': 'EUR', 'quote_currency': 'GBP', 'bid': '0.863470', 'ask': '0.863640', 'midpoint': '0.863555'},
        {'base_currency': 'EUR', 'quote_currency': 'JPY', 'bid': '126.634', 'ask': '126.651', 'midpoint': '126.642'},
        {'base_currency': 'EUR', 'quote_currency': 'KRW', 'bid': '1280.31', 'ask': '1282.71', 'midpoint': '1281.51'},
        {'base_currency': 'EUR', 'quote_currency': 'USD', 'bid': '1.13137', 'ask': '1.13149', 'midpoint': '1.13143'},
        {'base_currency': 'GBP', 'quote_currency': 'CNY', 'bid': '8.78454', 'ask': '8.78784', 'midpoint': '8.78619'},
        {'base_currency': 'GBP', 'quote_currency': 'EUR', 'bid': '1.15789', 'ask': '1.15812', 'midpoint': '1.15800'},
        {'base_currency': 'GBP', 'quote_currency': 'GBP', 'bid': '1.00000', 'ask': '1.00000', 'midpoint': '1.00000'},
        {'base_currency': 'GBP', 'quote_currency': 'JPY', 'bid': '146.628', 'ask': '146.653', 'midpoint': '146.640'},
        {'base_currency': 'GBP', 'quote_currency': 'KRW', 'bid': '1482.48', 'ask': '1485.31', 'midpoint': '1483.90'},
        {'base_currency': 'GBP', 'quote_currency': 'USD', 'bid': '1.31002', 'ask': '1.31021', 'midpoint': '1.31012'},
        {'base_currency': 'JPY', 'quote_currency': 'CNY', 'bid': '0.0599066', 'ask': '0.0599274',
         'midpoint': '0.0599170'},
        {'base_currency': 'JPY', 'quote_currency': 'EUR', 'bid': '0.00789571', 'ask': '0.00789677',
         'midpoint': '0.00789624'},
        {'base_currency': 'JPY', 'quote_currency': 'GBP', 'bid': '0.00681882', 'ask': '0.00681998',
         'midpoint': '0.00681940'},
        {'base_currency': 'JPY', 'quote_currency': 'JPY', 'bid': '1.00000', 'ask': '1.00000', 'midpoint': '1.00000'},
        {'base_currency': 'JPY', 'quote_currency': 'KRW', 'bid': '10.1099', 'ask': '10.1289', 'midpoint': '10.1194'},
        {'base_currency': 'JPY', 'quote_currency': 'USD', 'bid': '0.00893376', 'ask': '0.00893479',
         'midpoint': '0.00893428'},
        {'base_currency': 'KRW', 'quote_currency': 'CNY', 'bid': '0.00591512', 'ask': '0.00592692',
         'midpoint': '0.00592102'},
        {'base_currency': 'KRW', 'quote_currency': 'EUR', 'bid': '0.000779601', 'ask': '0.000781058',
         'midpoint': '0.000780330'},
        {'base_currency': 'KRW', 'quote_currency': 'GBP', 'bid': '0.000673259', 'ask': '0.000674543',
         'midpoint': '0.000673901'},
        {'base_currency': 'KRW', 'quote_currency': 'JPY', 'bid': '0.0987276', 'ask': '0.0989131',
         'midpoint': '0.0988204'},
        {'base_currency': 'KRW', 'quote_currency': 'KRW', 'bid': '1.00000', 'ask': '1.00000', 'midpoint': '1.00000'},
        {'base_currency': 'KRW', 'quote_currency': 'USD', 'bid': '0.000882110', 'ask': '0.000883665',
         'midpoint': '0.000882888'},
        {'base_currency': 'USD', 'quote_currency': 'CNY', 'bid': '6.70565', 'ask': '6.70720', 'midpoint': '6.70642'},
        {'base_currency': 'USD', 'quote_currency': 'EUR', 'bid': '0.883790', 'ask': '0.883884', 'midpoint': '0.883837'},
        {'base_currency': 'USD', 'quote_currency': 'GBP', 'bid': '0.763236', 'ask': '0.763347', 'midpoint': '0.763292'},
        {'base_currency': 'USD', 'quote_currency': 'JPY', 'bid': '111.922', 'ask': '111.935', 'midpoint': '111.928'},
        {'base_currency': 'USD', 'quote_currency': 'KRW', 'bid': '1131.65', 'ask': '1133.64', 'midpoint': '1132.64'},
        {'base_currency': 'USD', 'quote_currency': 'USD', 'bid': '1.00000', 'ask': '1.00000', 'midpoint': '1.00000'}]}

REFINED_DATA = {'CNY': {'CNY': 1.0, 'EUR': 7.58785, 'GBP': 8.78619, 'JPY': 0.059917, 'KRW': 0.00592102, 'USD': 6.70642},
                'EUR': {'CNY': 0.13179, 'EUR': 1.0, 'GBP': 1.158, 'JPY': 0.00789624, 'KRW': 0.00078033,
                        'USD': 0.883837},
                'GBP': {'CNY': 0.113815, 'EUR': 0.863555, 'GBP': 1.0, 'JPY': 0.0068194, 'KRW': 0.000673901,
                        'USD': 0.763292},
                'JPY': {'CNY': 16.6897, 'EUR': 126.642, 'GBP': 146.64, 'JPY': 1.0, 'KRW': 0.0988204, 'USD': 111.928},
                'KRW': {'CNY': 168.89, 'EUR': 1281.51, 'GBP': 1483.9, 'JPY': 10.1194, 'KRW': 1.0, 'USD': 1132.64},
                'USD': {'CNY': 0.149111, 'EUR': 1.13143, 'GBP': 1.31012, 'JPY': 0.00893428, 'KRW': 0.000882888,
                        'USD': 1.0}}
RESULT_DATA = {'CNY': 0.10722168686049642, 'EUR': 0.8135792235121142, 'GBP': 0.9420893432893404,
               'JPY': 0.00642437155348768, 'KRW': 0.0006348629932707957, 'USD': 0.7190735462194603}


def test_oanda_api():
    res = oanda.get_spot(['KRW'])
    assert 'code' not in res
    assert 'meta' in res
    assert res['meta']['skipped_currency_pairs'] == []
    assert len(res['quotes']) == (len(settings['SDR_BUDGET']) + 1 ) ** 2


def test_oanda():
    currency_rates = oanda.refine_rates(ORIGIN_DATA)
    assert currency_rates == REFINED_DATA
    sdr_rates = oanda.calc_sdr_rates(currency_rates)
    assert sdr_rates == RESULT_DATA
