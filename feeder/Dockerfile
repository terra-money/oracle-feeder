FROM node:18-alpine

RUN apk add --no-cache curl jq

ENV ORACLE_FEEDER_DATA_SOURCE_URL=http://localhost:8532/latest
ENV	ORACLE_FEEDER_LCD_ADDRESS=https://terra-classic-lcd.publicnode.com,https://lcd.terraclassic.community
ENV ORACLE_FEEDER_CHAIN_ID=columbus-5
ENV ORACLE_FEEDER_KEY_NAME=voter
ENV ORACLE_FEEDER_KEY_PATH=voter.json
ENV ORACLE_FEEDER_COIN_TYPE=330
ENV ORACLE_FEEDER_ADDR_PREFIX=terra

WORKDIR /app

COPY package*.json ./

RUN npm i --production

COPY tsconfig.json ./
COPY src ./src
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]