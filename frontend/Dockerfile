FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
ARG REACT_APP_API_URL=http://localhost:5000

ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM nginx:alpine

RUN apk update && apk upgrade --no-cache

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]