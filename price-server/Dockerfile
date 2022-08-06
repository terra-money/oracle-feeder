FROM node:14-alpine

WORKDIR /app

COPY package*.json gate-api* ./

RUN npm i --production

COPY tsconfig.json ./
COPY ./config/default.js ./config/default.js
COPY ./config/default-sample.js ./config/default-sample.js
COPY src ./src

ENTRYPOINT [ "npm", "run" ]
CMD [ "start" ]
