export interface Player {
  id: string;
  x: number;
  y: number;
  message?: string;
  messageTimeout?: NodeJS.Timeout;
}

export interface ChatMessage {
  playerId: string;
  text: string;
  timestamp: number;
}