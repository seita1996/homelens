package main

import (
  "encoding/json"
	"fmt"
  "golang.org/x/net/websocket"
  "strings"
)

type Room struct {
	forward	chan string			// With a message to send to all other clients
	clients	map[string]*Client	// All clients in the room
}

func newRoom(name string) *Room {
  escapedName := strings.Replace(name, "\n", "", -1)
  escapedName = strings.Replace(escapedName, "\r", "", -1)
	fmt.Println("[newRoom()] New Room name: " + escapedName)
	room := &Room {
		forward:	make(chan string),
		clients:	make(map[string]*Client),
	}
	printStruct("[newRoom()] Room num", len(rooms))
	if _, ok := rooms[name]; ok {
		fmt.Println("[newRoom()] The Room Exists")
	} else {
		fmt.Println("[newRoom()] Create New Room")
		rooms[name] = room
		printStruct("[newRoom()] Room num", len(rooms))
	}
	return rooms[name]
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

  // Send Clients list in the Room member
  c.room.forward <- r.memberNames()
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

  // Send Clients list in the Room member
  c.room.forward <- r.memberNames()
}

func (r *Room) memberNames() string {
  var nameList []string
  for key := range r.clients {
    nameList = append(nameList, key)
  }
  nameListJ, _ := json.Marshal(nameList)
  return "{ \"type\": \"namelist\", \"data\": " + string(nameListJ) + " }"
}

func (r *Room) run() {
  for {
    select {
    case message := <-r.forward:
      fmt.Println("[run()] message: " + message)
      type Message struct {
        Type string
        Target string
      }
      var m Message
      if err := json.Unmarshal([]byte(message), &m); err != nil {
        panic(err)
      }
      for _, client := range r.clients {
        if m.Type != "healthcheck" && (m.Target == "" || m.Target == client.name) {
          // TODO: Websocket is placed only in Client
          err := websocket.Message.Send(client.socket, message)
          if err != nil {
            fmt.Println(err)
          }
        }
      }
    }
  }
}
