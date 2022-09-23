package main

import (
	"fmt"
	"net/http"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

func handleWebSocket(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		// 初回のメッセージを送信
		err := websocket.Message.Send(ws, "ping")
		if err != nil {
			c.Logger().Error(err)
		}

		for {
			// Client からのメッセージを読み込む
			msg := ""
			err = websocket.Message.Receive(ws, &msg)
			if err != nil {
				c.Logger().Error(err)
				break
			}
			fmt.Println("Receive: " + msg)

			// Client からのメッセージを元に返すメッセージを作成し送信する
			err := websocket.Message.Send(ws, fmt.Sprintf("Server: \"%s\" received!", msg))
			if err != nil {
				c.Logger().Error(err)
				break
			}
			fmt.Println("Send: " + msg)
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
