package main

import (
  "fmt"
  "golang.org/x/net/websocket"
)

type Client struct {
	socket	*websocket.Conn	// WebSocket Connection
	send	chan string		// Channel to send a message to the browser
	room	*Room			// The chat room to which the client belongs
	name	string
  ua  string
  mobile bool
}

func writeMessage(ws *websocket.Conn, message string) error {
  return websocket.Message.Send(ws, message)
}

func readMessage(ws *websocket.Conn) (string, error) {
  msg := ""
  err := websocket.Message.Receive(ws, &msg)
  if err != nil {
      return "", err
  }
  return string(msg), nil
}

func (c *Client) run() {
  for {
    // Read messages from Client
    msg, err := readMessage(c.socket)
    if err != nil {
      fmt.Println(err)
      break
    }
    c.room.forward <- msg
  }
}
