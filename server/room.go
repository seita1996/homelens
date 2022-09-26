package main

import (
	"fmt"
)

type Room struct {
	forward	chan string			// With a message to send to all other clients
	clients	map[string]*Client	// All clients in the room
}

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
