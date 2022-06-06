FROM node:14-alpine

ENV SOURCE=http://localhost:8532/latest
ENV	LCD_ADDRESS=https://lcd.terra.dev
ENV CHAIN_ID=columbus-5
ENV VALIDATOR=terravaloper1xx
ENV KEY_PATH=voter.json
ENV PASSPHRASE=not2secure

WORKDIR /app

COPY package*.json ./

RUN npm i --production

COPY tsconfig.json ./
COPY $KEY_PATH ./
COPY src ./src

ENTRYPOINT [ "npm", "start" ]
CMD [ "vote" ]
