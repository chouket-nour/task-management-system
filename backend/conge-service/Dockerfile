FROM node:22-slim

RUN apk update && apk upgrade --no-cache && \
    npm install -g npm@10

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5005

CMD ["node", "server.js"]