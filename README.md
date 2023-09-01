# Terra Oracle Feeder

This contains the Oracle feeder software that is used for periodically submitting oracle votes for the exchange rate of the different assets offered by the oracle chain. This implementation can be used as-is, but also can serve as a reference for creating your own custom oracle feeder.

Every validator must participate in the oracle process and periodically submit a vote for the exchange rate of LUNC in all whitelisted denominations. Because this process occurs every 30 seconds, validators must set up an automated process to avoid getting slashed and jailed.

## Overview

This solution has 2 components:

1. [`price-server`](price-server/)

   - Obtain information from various data sources (exchanges, forex data, etc),
   - Model the data,
   - Enable a url to query the data,

2. [`feeder`](feeder/)

   - Reads the exchange rates data from a data source (`price-server`)
   - Periodically submits vote and prevote messages following the oracle voting procedure

## Requirements
1. Validator node setup
2. Public / private network 
3. Instance for blockchain node(s) that will be used for broadcasting the transaction.
4. Instance for running price server bounded to the internet.
5. Instance for running feeder in the private network, which can be used with the validator node. The important part is that it should stay in the private network.

## Using `docker-compose` (Recommended) (Experimental)

1. Install Docker

	- [Docker Install documentation](https://docs.docker.com/install/)
	- [Docker-Compose Install documentation](https://docs.docker.com/compose/install/)

2. `curl -o docker-compose.yml https://raw.githubusercontent.com/classic-terra/oracle-feeder/main/docker-compose.yml`

3. Review the docker-compose.yml service oracle-feeder and change ENV accordingly

* ORACLE_FEEDER_PASSWORD=password (required) Oracle feeder keyring password
* ORACLE_FEEDER_MNENOMIC=word1 word2... (required) (Oracle feeder mnemonic, this address will be responsible for updating price)
* ORACLE_FEEDER_VALIDATORS=terravaloper1xxx (required) (Oracle feeder validator that feeder address is bount to) [How to bound?](feeder/README.md#make-a-new-key-for-oracle-votes) (**REMEMBER TO BOUND YOUR VOTER TO VALIDATOR BEFORE RUNNING**)
* ORACLE_FEEDER_LCD_ADDRESS=https://terra-classic-lcd.publicnode.com,https://lcd.terraclassic.community (optional)
* ORACLE_FEEDER_CHAIN_ID=columbus-5 (optional)

4. Bring up your stack by running

	```bash
	docker-compose up -d
	```

## Manual deployment instructions

1. Install Node.js (https://nodejs.org/)

2. Clone this repository

```sh
git clone https://github.com/classic-terra/oracle-feeder
cd oracle-feeder
```

3. Configure and launch `price-server`, following instructions [here](price-server/).

```sh
cd price-server
npm install

# Copy sample config file
cp ./config/default-sample.js ./config/default.js

# make edits
vim ./config/default.js

# price is available at `http://127.0.0.1:8532/latest`
npm run start
```

4. Configure and launch `feeder`, following instructions [here](feeder/).

```sh
cd feeder
npm install

# configure to use feeder account
npm start add-key

# start voting (note: multiple lcd-url and validators can be specified)
$ npm start vote -- \
   --data-source-url http://localhost:8532/latest \
   --lcd-url https://terra-classic-lcd.publicnode.com \
   --lcd-url https://lcd.terraclassic.community \
   --chain-id columbus-5 \
   --validators <terravaloper address> \
   --password <password>
```

### Cheat Sheet:

#### Start

```bash
docker-compose up -d
```

#### Stop

```bash
docker-compose stop
```

#### Clean

```bash
docker-compose down
```

#### View Logs

```bash
docker-compose logs -f
```

#### Upgrade

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

#### Build from source

```
docker-compose -f docker-compose.yml -f docker-compose.build.yml build --no-cache
```
