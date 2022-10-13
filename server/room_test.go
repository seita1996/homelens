package main

import (
  "reflect"
  "testing"
)

func TestNewRoom(t *testing.T) {
  t.Run("Return Type", func(t *testing.T) {
    if got := reflect.TypeOf(newRoom("123.456.789.000")).String(); got != "*main.Room" {
      t.Errorf("newRoom() = %v, want %v", got, "*main.Room")
    }
  })
  t.Run("When Create Room is done, the method returns the newly created Room", func(t *testing.T) {
    roomname := "123.345.456.678"
    if got := newRoom(roomname); got != rooms[roomname] {
      t.Errorf("newRoom() = %v, want %v", got, rooms[roomname])
    }
  })
  t.Run("The number of Rooms increases when it is a non-existent Room", func(t *testing.T) {
    newRoom("000.000.000.000")
    beforeRoomsNum := len(rooms)
    newRoom("111.111.111.111")
    afterRoomsNum := len(rooms)
    if (beforeRoomsNum + 1) != afterRoomsNum {
      t.Errorf("beforeRoomsNum: %v, afterRoomsNum: %v", beforeRoomsNum, afterRoomsNum)
    }
  })
  t.Run("If it is an existing Room, the method returns the target Room", func(t *testing.T) {
    roomname := "123.345.456.678"
    newRoom(roomname)
    if got := newRoom(roomname); got != rooms[roomname] {
      t.Errorf("newRoom() = %v, want %v", got, rooms[roomname])
    }
  })
  t.Run("The number of Rooms does not increase when it is a Room that exists", func(t *testing.T) {
    roomname := "123.345.456.678"
    newRoom(roomname)
    beforeRoomsNum := len(rooms)
    newRoom(roomname)
    afterRoomsNum := len(rooms)
    if beforeRoomsNum != afterRoomsNum {
      t.Errorf("beforeRoomsNum: %v, afterRoomsNum: %v", beforeRoomsNum, afterRoomsNum)
    }
  })
}

func TestJoin(t *testing.T) {
  // Test Data Preparations
  roomname := "123.345.456.678"
  testRoom := newRoom(roomname)
  go testRoom.testrun(t)
  testClient := &Client {
    socket: nil,
    send:   make(chan string),
    room:   testRoom,
    name:	"hoge",
  }

  t.Run("When a Client joins a Room, the number of Clients belonging to the Room increases", func(t *testing.T) {
    beforeClientNum := len(rooms[roomname].clients)
    testRoom.join(testClient)
    afterClientNum := len(rooms[roomname].clients)
    if (beforeClientNum + 1) != afterClientNum {
      t.Errorf("beforeClientNum: %v, afterClientNum: %v", beforeClientNum, afterClientNum)
    }
  })
  t.Run("When a Client leaves a Room, the number of Clients belonging to the Room decreases", func(t *testing.T) {
    beforeClientNum := len(rooms[roomname].clients)
    testRoom.leave(testClient)
    afterClientNum := len(rooms[roomname].clients)
    if (beforeClientNum - 1) != afterClientNum {
      t.Errorf("beforeClientNum: %v, afterClientNum: %v", beforeClientNum, afterClientNum)
    }
  })
}

func (r *Room) testrun(t *testing.T) {
  for {
    select {
    case message := <-r.forward:
      t.Log("Receive: " + message)
    }
  }
}
