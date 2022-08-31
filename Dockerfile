FROM node:16.11.1-alpine3.14

WORKDIR /app

RUN apk update && \
    apk add git

USER node

EXPOSE 3000
