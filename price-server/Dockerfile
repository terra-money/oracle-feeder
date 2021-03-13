FROM node:14-alpine

WORKDIR /app

COPY package*.json gate-api* ./

RUN npm i --production

COPY tsconfig.json ./
COPY src ./src
COPY ./config/docker.js ./config/default.js

ENTRYPOINT [ "npm", "run" ]
CMD [ "start" ]
