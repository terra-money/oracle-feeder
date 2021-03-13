FROM node:14-alpine

WORKDIR /app

COPY package*.json gate-api* ./

RUN npm i --production

COPY src ./src
COPY config ./config
COPY tsconfig.json ./

ENTRYPOINT [ "npm", "run" ]
CMD [ "start" ]
