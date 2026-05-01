FROM node:22-alpine

#  Mise à jour du système et des packages Alpine
RUN apk update && apk upgrade --no-cache

WORKDIR /app



COPY package*.json ./

#  npm ci plus fiable que npm install en CI/CD
RUN npm ci --only=production

#  Forcer la mise à jour des packages vulnérables
RUN npm install \
    tar@^7.5.11 \
    minimatch@^9.0.7 \
    cross-spawn@^7.0.5 \
    glob@^10.5.0 \
    --save-exact

COPY . .

EXPOSE 5003

CMD ["node", "server.js"]