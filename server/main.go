package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Player struct {
	ID        string  `json:"id"`
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Message   string  `json:"message,omitempty"`
	SpriteType string `json:"spriteType"`
	Name      string  `json:"name"`
}

type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type GameState struct {
	Players map[string]*Player `json:"players"`
	mu      sync.RWMutex
}

var (
	gameState = GameState{
		Players: make(map[string]*Player),
	}

	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for development
		},
	}

	clients = make(map[*websocket.Conn]string)
	clientsMu sync.RWMutex
)

func broadcastGameState() {
	gameState.mu.RLock()
	state := WSMessage{
		Type:    "gameState",
		Payload: gameState.Players,
	}
	gameState.mu.RUnlock()

	message, err := json.Marshal(state)
	if err != nil {
		log.Printf("Error marshaling game state: %v", err)
		return
	}

	clientsMu.RLock()
	for conn := range clients {
		err := conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("Error sending message: %v", err)
		}
	}
	clientsMu.RUnlock()
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}
	defer conn.Close()

	// Generate player ID and create initial player
	playerID := uuid.New().String()
	player := &Player{
		ID:        playerID,
		X:         float64(100 + (len(gameState.Players) * 50)), // Spread players out
		Y:         100,
		SpriteType: "ghost",
		Name:      "Player",
	}

	// Add player to game state
	gameState.mu.Lock()
	gameState.Players[playerID] = player
	gameState.mu.Unlock()

	// Add client connection to clients map
	clientsMu.Lock()
	clients[conn] = playerID
	clientsMu.Unlock()

	// Send initial game state to new player
	broadcastGameState()

	// Clean up when connection closes
	defer func() {
		clientsMu.Lock()
		delete(clients, conn)
		clientsMu.Unlock()

		gameState.mu.Lock()
		delete(gameState.Players, playerID)
		gameState.mu.Unlock()

		broadcastGameState()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		var wsMessage WSMessage
		if err := json.Unmarshal(message, &wsMessage); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		switch wsMessage.Type {
		case "setPlayerInfo":
			var playerInfo struct {
				Name      string `json:"name"`
				SpriteType string `json:"spriteType"`
			}
			infoData, err := json.Marshal(wsMessage.Payload)
			if err != nil {
				continue
			}
			if err := json.Unmarshal(infoData, &playerInfo); err != nil {
				continue
			}

			gameState.mu.Lock()
			if player, ok := gameState.Players[playerID]; ok {
				player.Name = playerInfo.Name
				player.SpriteType = playerInfo.SpriteType
			}
			gameState.mu.Unlock()

			broadcastGameState()

		case "updatePosition":
			var updatedPlayer Player
			playerData, err := json.Marshal(wsMessage.Payload)
			if err != nil {
				continue
			}
			if err := json.Unmarshal(playerData, &updatedPlayer); err != nil {
				continue
			}

			gameState.mu.Lock()
			if player, ok := gameState.Players[playerID]; ok {
				player.X = updatedPlayer.X
				player.Y = updatedPlayer.Y
			}
			gameState.mu.Unlock()

			broadcastGameState()

		case "sendMessage":
			var messageData struct {
				Message string `json:"message"`
			}
			msgData, err := json.Marshal(wsMessage.Payload)
			if err != nil {
				continue
			}
			if err := json.Unmarshal(msgData, &messageData); err != nil {
				continue
			}

			gameState.mu.Lock()
			if player, ok := gameState.Players[playerID]; ok {
				player.Message = messageData.Message
			}
			gameState.mu.Unlock()

			broadcastGameState()

			// Clear message after 5 seconds
			go func() {
				time.Sleep(5 * time.Second)
				gameState.mu.Lock()
				if player, ok := gameState.Players[playerID]; ok {
					player.Message = ""
				}
				gameState.mu.Unlock()
				broadcastGameState()
			}()
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)

	port := ":8080"
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}