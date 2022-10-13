package main

import (
	"encoding/json"
	"fmt"
	"time"
	"net/http"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
  "golang.org/x/net/websocket"
  "strings"
)

var rooms = make(map[string]*Room)

func printStruct(title string, stru any) {
	jsons, _ := json.Marshal(stru)
	fmt.Println(title + ": " + string(jsons))
}

func healthCheck(c echo.Context) error {
	return c.String(http.StatusOK, "OK")
}

func handleWebSocket(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

    // For IPoE connections, IPv4 addresses cannot be obtained, so the value sent after obtaining the address from the Client is used.
    // TODO: あくまでc.RealIP()の値を優先し、ipv6形式であればQueryParamを採用するロジックにする
    escapedIp := strings.Replace(c.QueryParam("ipv4"), "\n", "", -1)
    escapedIp = strings.Replace(escapedIp, "\r", "", -1)
		fmt.Println("[handleWebSocket()] 接続元IP: " + escapedIp)
		r := newRoom(c.QueryParam("ipv4"))

    // Processes Messages sent to a specific Room
    go r.run()

		client := &Client {
			socket: ws,
			send:   make(chan string),
			room:   r,
			name:	time.Now().Format("2006-01-02 15:04:05"),
		}
		r.join(client)
		printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.QueryParam("ipv4")].clients))

		defer func() {
			r.leave(client)
			printStruct("[handleWebSocket()] Clients in Room num", len(rooms[c.QueryParam("ipv4")].clients))
		}()

		// Send initial message
		err := writeMessage(ws, "{ \"type\": \"healthcheck\", \"data\": \"ping\" }")
		if err != nil {
			c.Logger().Error(err)
		}

    // Send Your Name
    yourname := "{ \"type\": \"yourname\", \"data\": \"" + client.name + "\" }"
    client.room.forward <- yourname

    // Standby to receive messages
    client.run()
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Static("/", "public")
	e.GET("/hc", healthCheck)
	e.GET("/ws", handleWebSocket)
	e.Logger.Fatal(e.Start(":8080"))
}
