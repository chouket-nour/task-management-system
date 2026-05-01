FROM node:20-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5004
CMD ["node", "server.js"]