FROM node:22-alpine

RUN apk update && apk upgrade --no-cache && \
    npm install -g npm@10

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .
EXPOSE 5003

CMD ["node", "server.js"]