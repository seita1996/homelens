package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var rooms = make(map[string]*Room)

func printStruct(title string, stru any) {
	jsons, _ := json.Marshal(stru)
	fmt.Println(title + ": " + string(jsons))
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
