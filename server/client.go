package main

import (
	"fmt"
	"time"
  "github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

type Client struct {
	socket	*websocket.Conn	// WebSocket Connection
	send	chan string		// Channel to send a message to the browser
	room	*Room			// The chat room to which the client belongs
	name	string
}

func handleWebSocket(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

    // For IPoE connections, IPv4 addresses cannot be obtained, so the value sent after obtaining the address from the Client is used.
    // TODO: あくまでc.RealIP()の値を優先し、ipv6形式であればQueryParamを採用するロジックにする
		fmt.Println("[handleWebSocket()] 接続元IP: " + c.QueryParam("ipv4"))
		r := newRoom(c.QueryParam("ipv4"))
    go r.run()
		client := &Client {
			socket: ws,
			send:   make(chan string),
			room:   r,
			name:	time.Now().Format("2006-01-02 15:04:05"),
		}
		printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.QueryParam("ipv4")].clients))
		r.join(client)
		printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.QueryParam("ipv4")].clients))

		defer func() {
			printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.QueryParam("ipv4")].clients))
			r.leave(client)
			printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.QueryParam("ipv4")].clients))
		}()

		// Send initial message
		err := websocket.Message.Send(ws, "{ \"type\": \"healthcheck\", \"data\": \"ping\" }")
		if err != nil {
			c.Logger().Error(err)
		}

    // Send Your Name
    yourname := "{ \"type\": \"yourname\", \"data\": \"" + client.name + "\" }"
    err = websocket.Message.Send(ws, yourname)
		if err != nil {
			c.Logger().Error(err)
		}

		for {
			fmt.Println("[handleWebSocket()] 接続元IP: " + c.QueryParam("ipv4"))

			// Read messages from Client
			msg := ""
			err = websocket.Message.Receive(ws, &msg)
			if err != nil {
				c.Logger().Error(err)
				break
			}
			fmt.Println("[handleWebSocket()] Receive: " + msg)
			client.room.forward <- msg
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}
