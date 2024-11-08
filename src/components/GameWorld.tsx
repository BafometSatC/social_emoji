import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Sprite } from './Sprite';
import { ChatBox } from './ChatBox';
import { PlayerSetup } from './PlayerSetup';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Player } from '../types';

export const GameWorld: React.FC = () => {
  // State for managing players and drag functionality
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const gameWorldRef = useRef<HTMLDivElement>(null);
  
  // WebSocket hooks and utilities
  const { connect, updatePosition, sendChatMessage, setPlayerInfo, wsRef } = useWebSocket();

  // Get current player's ID from WebSocket URL
  const getCurrentPlayerId = useCallback(() => {
    return wsRef.current?.url.split('/').pop() || '';
  }, [wsRef]);

  // Handle player setup completion
  const handleSetupComplete = (name: string, spriteType: string) => {
    setPlayerInfo(name, spriteType);
    setIsSetupComplete(true);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const cleanup = connect();

    if (wsRef.current) {
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'gameState') {
          setPlayers(data.payload);
        }
      };
    }

    return cleanup;
  }, [connect, wsRef]);

  // Handle mouse down event for sprite dragging
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const currentPlayerId = getCurrentPlayerId();
    const currentPlayer = players[currentPlayerId];
    
    if (currentPlayer) {
      setIsDragging(true);
    }
  }, [getCurrentPlayerId, players]);

  // Handle mouse move event during dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !gameWorldRef.current) return;

    const rect = gameWorldRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 32));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 32));
    
    updatePosition(x, y);
  }, [isDragging, updatePosition]);

  // Handle mouse up event to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add and remove mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle keyboard movement
  useEffect(() => {
    const handleKeyMovement = (e: KeyboardEvent) => {
      const currentPlayerId = getCurrentPlayerId();
      const currentPlayer = players[currentPlayerId];
      if (!currentPlayer) return;

      const speed = 10;
      let newX = currentPlayer.x;
      let newY = currentPlayer.y;

      switch (e.key) {
        case 'ArrowUp':
          newY = Math.max(0, currentPlayer.y - speed);
          break;
        case 'ArrowDown':
          newY = Math.min(window.innerHeight - 50, currentPlayer.y + speed);
          break;
        case 'ArrowLeft':
          newX = Math.max(0, currentPlayer.x - speed);
          break;
        case 'ArrowRight':
          newX = Math.min(window.innerWidth - 50, currentPlayer.x + speed);
          break;
        default:
          return;
      }

      updatePosition(newX, newY);
    };

    window.addEventListener('keydown', handleKeyMovement);
    return () => window.removeEventListener('keydown', handleKeyMovement);
  }, [players, getCurrentPlayerId, updatePosition]);

  return (
    <>
      {!isSetupComplete && <PlayerSetup onComplete={handleSetupComplete} />}
      <div 
        ref={gameWorldRef}
        className="fixed inset-0 bg-gradient-to-b from-blue-50 to-purple-50 game-world"
      >
        {Object.values(players).map((player) => (
          <Sprite
            key={player.id}
            x={player.x}
            y={player.y}
            message={player.message}
            name={player.name}
            spriteType={player.spriteType}
            isCurrentPlayer={player.id === getCurrentPlayerId()}
            onDragStart={handleDragStart}
            selected={isDragging && player.id === getCurrentPlayerId()}
          />
        ))}
        <ChatBox onSendMessage={sendChatMessage} />
      </div>
    </>
  );
};