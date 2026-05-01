FROM node:22-alpine AS build

RUN apk update && apk upgrade --no-cache


WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN npm install tar@^7.5.11 minimatch@^9.0.7 cross-spawn@^7.0.5 glob@^10.5.0 --save-exact

COPY . .

RUN npm run build

FROM nginx:alpine

RUN apk update && apk upgrade --no-cache

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]