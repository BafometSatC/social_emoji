export interface Player {
  id: string;
  x: number;
  y: number;
  message?: string;
  spriteType: string;
  name: string;
}

export interface WSMessage {
  type: string;
  payload: any;
}