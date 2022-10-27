package main

import (
  "encoding/json"
	"fmt"
  "strconv"
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
	}
	return rooms[name]
}

func (r *Room) join(c *Client) {
	r.clients[c.name] = c
	printStruct("[join()] c name", &c.name)

  // Send Clients list in the Room member
  c.room.forward <- r.members()
}

func (r *Room) leave(c *Client) {
	delete(r.clients, c.name)
	printStruct("[leave()] c name", &c.name)

  // Send Clients list in the Room member
  c.room.forward <- r.members()
}

func (r *Room) members() string {
  var memberList []string
  for _, value := range r.clients {
    memberList = append(memberList, "{ \"name\": \"" + value.name + "\", \"ua\": \"" + value.ua + "\", \"mobile\": \"" + strconv.FormatBool(value.mobile) + "\" }")
  }
  memberListJ, _ := json.Marshal(memberList)
  return "{ \"type\": \"memberlist\", \"data\": " + string(memberListJ) + " }"
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
          err := writeMessage(client.socket, message)
          if err != nil {
            fmt.Println(err)
          }
        }
      }
    }
  }
}
