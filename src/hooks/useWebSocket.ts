import { useEffect, useRef, useCallback } from 'react';
import type { Player } from '../types';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onclose = () => {
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    };

    return () => {
      ws.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    sendMessage('updatePosition', { x, y });
  }, [sendMessage]);

  const sendChatMessage = useCallback((message: string) => {
    sendMessage('sendMessage', { message });
  }, [sendMessage]);

  const setPlayerInfo = useCallback((name: string, spriteType: string) => {
    sendMessage('setPlayerInfo', { name, spriteType });
  }, [sendMessage]);

  return {
    connect,
    updatePosition,
    sendChatMessage,
    setPlayerInfo,
    wsRef,
  };
};