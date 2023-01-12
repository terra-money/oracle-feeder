FROM node:14-alpine

ENV ORACLE_FEEDER_DATA_SOURCE_URL=http://localhost:8532/latest
ENV	ORACLE_FEEDER_LCD_ADDRESS=https://columbus-lcd.terra.dev
ENV ORACLE_FEEDER_CHAIN_ID=columbus-5
ENV ORACLE_FEEDER_VALIDATORS=terravaloper1xx
ENV ORACLE_FEEDER_KEY_NAME=voter
ENV ORACLE_FEEDER_KEY_PATH=voter.json
ENV ORACLE_FEEDER_COIN_TYPE=118
ENV ORACLE_FEEDER_PASSWORD=not2secure
ENV ORACLE_FEEDER_MNENOMIC="torch swamp cancel lift never october child harsh rib aspect luxury word peanut length bamboo hawk material vehicle glue above west random sketch author"
ENV ORACLE_FEEDER_IV_SALT="myHashedIV"

WORKDIR /app

COPY package*.json ./

RUN npm i --production

COPY tsconfig.json ./
COPY $KEY_PATH ./
COPY src ./src

ENTRYPOINT [ "npm", "start" ]
CMD [ "vote" ]