FROM golang:1.19.1-alpine3.16

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY *.go ./

# RUN go build -o /websocket-server

EXPOSE 8080

# CMD [ "/websocket-server" ]
