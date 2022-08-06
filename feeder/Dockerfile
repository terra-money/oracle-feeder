FROM node:16.13.0

ENV ORACLE_FEEDER_PRICE_ENDPOINT=http://localhost:8532/latest
ENV	ORACLE_FEEDER_LCD_ADDRESSES=https://lcd.terra.dev
ENV ORACLE_FEEDER_CHAIN_ID="rebel-1"
ENV ORACLE_VALIDATOR_ADDRESSES="terravaloper1xx"
ENV ORACLE_FEEDER_KEY_PATH="voter.json"
ENV ORACLE_FEEDER_PASSPHRASE="12345678"
ENV ORACLE_FEEDER_MNEMONIC="torch swamp cancel lift never october child harsh rib aspect luxury word peanut length bamboo hawk material vehicle glue above west random sketch author"

WORKDIR /app

COPY package*.json ./

RUN npm i --production

COPY tsconfig.json ./
COPY src ./src

RUN npm start update-key

CMD npm start vote
