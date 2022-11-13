package main

import (
  "fmt"
  "golang.org/x/net/websocket"
  "math/rand"
  "time"
)

type Client struct {
	socket	*websocket.Conn	// WebSocket Connection
	send	chan string		// Channel to send a message to the browser
	room	*Room			// The chat room to which the client belongs
  id string
	name	string
  ua  string
  mobile bool
}

func generateClientId(n int) string {
  letter := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

  charbox := make([]rune, n)
  for i := range charbox {
    charbox[i] = letter[rand.Intn(len(letter))]
  }
  return string(charbox)
}

func generateClientName() string {
  colors := [] string{"Red", "Blue", "Yellow", "Black", "White", "Gray", "Brown", "Orange", "Pink", "Green", "Purple"}
  animals := [] string{"Dog", "Rabbit", "Horse", "Wolf", "Bear", "Koala", "Gorilla", "Monkey", "Deer", "Zebra", "Tiger", "Cat", "Mouse", "Pig"}
  rand.Seed(time.Now().UnixNano())
  color_num := rand.Intn(len(colors))
  animal_num := rand.Intn(len(animals))
  return colors[color_num] + " " + animals[animal_num]
}

func newClient(ws *websocket.Conn, r *Room, ua_text string, ua_is_mobile bool) *Client {
  return &Client {
    socket: ws,
    send: make(chan string),
    room: r,
    id: generateClientId(32),
    name: generateClientName(),
    ua: ua_text,
    mobile: ua_is_mobile,
  }
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
