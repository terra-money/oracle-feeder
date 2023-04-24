FROM node:18-alpine

ENV ORACLE_FEEDER_DATA_SOURCE_URL=http://localhost:8532/latest
ENV	ORACLE_FEEDER_LCD_ADDRESS=https://terra-classic-lcd.publicnode.com
ENV ORACLE_FEEDER_CHAIN_ID=columbus-5
ENV ORACLE_FEEDER_VALIDATORS=terravaloper1xx
ENV ORACLE_FEEDER_KEY_NAME=voter
ENV ORACLE_FEEDER_KEY_PATH=voter.json
ENV ORACLE_FEEDER_COIN_TYPE=330
ENV ORACLE_FEEDER_IV_SALT="myHashedIV"
ENV ORACLE_FEEDER_ADDR_PREFIX="adr"

WORKDIR /app

COPY package*.json ./

RUN npm i --production

COPY tsconfig.json ./
COPY $KEY_PATH ./
COPY src ./src
RUN npm start add-key

ENTRYPOINT [ "npm", "start" ]
CMD [ "vote" ]