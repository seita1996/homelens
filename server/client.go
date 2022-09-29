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

		fmt.Println("[handleWebSocket()] 接続元IP: " + c.RealIP())
		r := newRoom(c.RealIP())
    go r.run()
		client := &Client {
			socket: ws,
			send:   make(chan string),
			room:   r,
			name:	time.Now().Format("2006-01-02 15:04:05"),
		}
		printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.RealIP()].clients))
		r.join(client)
		printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.RealIP()].clients))

		defer func() {
			printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.RealIP()].clients))
			r.leave(client)
			printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.RealIP()].clients))
		}()

		// Send initial message
		err := websocket.Message.Send(ws, "{ \"type\": \"ping\" }")
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
			fmt.Println("[handleWebSocket()] 接続元IP: " + c.RealIP())

			// Read messages from Client
			msg := ""
			err = websocket.Message.Receive(ws, &msg)
			if err != nil {
				c.Logger().Error(err)
				break
			}
			// client.room.forward <- msg
			fmt.Println("[handleWebSocket()] Receive: " + msg)

			// Create a message to return based on the message from Client and send it
			// err := websocket.Message.Send(ws, fmt.Sprintf("Server: \"%s\" received!", msg))
			// if err != nil {
			// 	c.Logger().Error(err)
			// 	break
			// }
			// fmt.Println("[handleWebSocket()] Send: " + msg)
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}
