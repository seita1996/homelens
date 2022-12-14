package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
  "github.com/mssola/user_agent"
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
    // TODO: Make the logic to prioritize the value of c.RealIP() (if it is in ipv6 format, QueryParam is adopted)
    escapedIp := strings.Replace(c.QueryParam("ipv4"), "\n", "", -1)
    escapedIp = strings.Replace(escapedIp, "\r", "", -1)
		fmt.Println("[handleWebSocket()] 接続元IP: " + escapedIp)
		r := newRoom(c.QueryParam("ipv4"))

    ua := user_agent.New(c.Request().Header.Get("User-Agent"))
    fmt.Println("[handleWebSocket()] UA: " + ua.Platform())
    browser_name, _ := ua.Browser()
    fmt.Println("[handleWebSocket()] UA: " + browser_name)
    ua_text := ua.Platform() + " " + browser_name

    // Processes Messages sent to a specific Room
    go r.run()

    client := newClient(ws, r, ua_text, ua.Mobile())
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
    err = writeMessage(ws, yourname)
		if err != nil {
			c.Logger().Error(err)
		}

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
