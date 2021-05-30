# Terra Oracle Feeder

**NOTE:** This is intended to be used with mainnet Columbus-4 and Tequila testnet.

This contains the Oracle feeder software that is used internally by Terraform Labs' validator nodes for periodically submitting oracle votes for the exchange rate of LUNA. This implementation can be used as-is, but also can serve as a reference for creating your own custom oracle feeder. For more information regarding the oracle process, please refer to the [oracle module specs](https://docs.terra.money/dev/spec-oracle).

## Overview

This solution has 2 components:

1. [`price-server`](price-server/)

   - Obtain information from various data sources (exchanges, forex data, etc)
   - Use data to compute the exchange rates of LUNA for a given set of fiat denominations
   - Most recent LUNA exchange rates are available through HTTP endpoint

2. [`feeder`](feeder/)

   - Reads LUNA exchange rates from a data source (`price-server`)
   - Periodically submits vote and prevote messages following the oracle voting procedure

You can easily modify the logic for how LUNA exchange rates are computed by either directly modifying `price-server` or replacing the input stream for `feeder`.

## Prerequisites

- Install [Node.js version 12 or greater](https://nodejs.org/)

## Instructions

1. Clone this repository

```sh
git clone https://github.com/terra-money/oracle-feeder
cd oracle-feeder
```

2. Configure and launch `price-server`, following instructions [here](price-server/).

```sh
cd price-server
npm install

# Copy sample config file
cp ./config/default.sample.js ./config/default.js
# make edits
vim ./config/default.js

# price is available at `http://127.0.0.1:8532/latest`
npm run start
```

3. Configure and launch `feeder`, following instructions [here](feeder/).

```sh
cd feeder
npm install

# configure to use feeder account
npm start update-key

# start voting
npm start vote -- \
   --source http://localhost:8532/latest \
   --lcd https://lcd.terra.dev \
   --chain-id columbus-3 \
   --denoms sdr,krw,usd,mnt,eur,cny,jpy,gbp,inr,cad,chf,hkd,aud,sgd \
   --validator <terravloper...> \
   --password "<password>" \
   --gas-prices 169.77ukrw
```
