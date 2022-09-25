package main

import (
	"encoding/json"
	"fmt"
	"time"
	"net/http"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

type Client struct {
	socket	*websocket.Conn	// WebSocket Connection
	send	chan string		// Channel to send a message to the browser
	room	*Room			// The chat room to which the client belongs
	name	string
}

type Room struct {
	forward	chan string			// With a message to send to all other clients
	clients	map[string]*Client	// All clients in the room
}

var rooms = make(map[string]Room)

func newRoom(name string) *Room {
	fmt.Println("[newRoom()] New Room name: " + name)
	room := &Room {
		forward:	make(chan string),
		clients:	make(map[string]*Client),
	}
	printStruct("[newRoom()] Room num", len(rooms))
	if _, ok := rooms[name]; ok {
		fmt.Println("[newRoom()] The Room Exists")
	} else {
		fmt.Println("[newRoom()] Create New Room")
		rooms[name] = *room
		printStruct("[newRoom()] Room num", len(rooms))
	}
	return room
}

func printStruct(title string, stru any) {
	jsons, _ := json.Marshal(stru)
	fmt.Println(title + ": " + string(jsons))
}

func (r *Room) join(c *Client) {
  fmt.Println("[join()] all Clients in the Room start")
  for key := range r.clients {
    printStruct("[join()] key", key)
  }
  fmt.Println("[join()] all Clients in the Room end")

  fmt.Println("[handleWebSocket()] join!!!")
	r.clients[c.name] = c

  fmt.Println("[join()] all Clients in the Room start")
  for key := range r.clients {
    printStruct("[join()] key", key)
  }
  fmt.Println("[join()] all Clients in the Room end")
	printStruct("[join()] c name", &c.name)
}

func (r *Room) leave(c *Client) {
  fmt.Println("[handleWebSocket()] leave!!!")
	delete(r.clients, c.name)

  fmt.Println("[leave()] all Clients in the Room start")
  for key := range r.clients {
    printStruct("[leave()] key", key)
  }
  fmt.Println("[leave()] all Clients in the Room end")
	printStruct("[leave()] c name", &c.name)
}

func handleWebSocket(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		fmt.Println("[handleWebSocket()] 接続元IP: " + c.RealIP())
		r := newRoom(c.RealIP())
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
		err := websocket.Message.Send(ws, "ping")
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
			client.room.forward <- msg
			fmt.Println("[handleWebSocket()] Receive: " + msg)

			// Create a message to return based on the message from Client and send it
			err := websocket.Message.Send(ws, fmt.Sprintf("Server: \"%s\" received!", msg))
			if err != nil {
				c.Logger().Error(err)
				break
			}
			fmt.Println("[handleWebSocket()] Send: " + msg)
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func healthCheck(c echo.Context) error {
	return c.String(http.StatusOK, "OK")
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Static("/", "public")
	e.GET("/hc", healthCheck)
	e.GET("/ws", handleWebSocket)
	e.Logger.Fatal(e.Start(":8080"))
}
