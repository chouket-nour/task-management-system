FROM node:22-alpine

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm install \
        tar@^7.5.11 \
        minimatch@^9.0.7 \
        cross-spawn@^7.0.5 \
        glob@^10.5.0 \
        --save-exact

COPY . .

EXPOSE 5002

CMD ["node", "server.js"]