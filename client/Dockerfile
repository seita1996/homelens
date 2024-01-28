FROM node:20.11-alpine3.18

WORKDIR /app

RUN apk update && \
    apk add git && \
    npm install -g pnpm

USER node

EXPOSE 3000
