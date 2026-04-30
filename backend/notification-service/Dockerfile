FROM node:18-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5006
CMD ["node", "server.js"]