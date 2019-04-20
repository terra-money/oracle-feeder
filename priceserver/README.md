# Oracle Price Server

## Install

#### 1. install python3+ and pip
#### 2. install requirments modules
```bash
$ pip install -Ur requirements.txt
```

## Update config file

#### 1. copy setting_sample.json to setting.json
```bash
$ cp setting_sample.json setting.json
```

#### 2. chain settings
```json
{
  "SDR_BUDGET": {
    "USD": 0.58252,
    "EUR": 0.38671,
    "CNY": 1.0174,
    "JPY": 11.900,
    "GBP": 0.085946
  },
  "UPDATER": {
    "CURRENCIES": [  // currencies to serve
      "USD",
      "KRW",
      "CNY",
      "JPY",
      "EUR",
      "GBP"
    ],
    "DENOM": "LUNA"
  },
  "API_KEYS": {
    "CURRENCYLAYER": "",
    "OANDA": ""
  }
}
```

## Run
```bash
$ PYTHOPATH=. FLASK_ENV=production ./start.sh --host 0.0.0.0
```