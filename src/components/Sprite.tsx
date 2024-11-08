import React from 'react';
import { Ghost, Bot, Skull, Bird, Cat, Dog } from 'lucide-react';

// Map of available sprite components
const spriteComponents = {
  ghost: Ghost,
  robot: Bot,
  skull: Skull,
  bird: Bird,
  cat: Cat,
  dog: Dog,
};

interface SpriteProps {
  x: number;
  y: number;
  message?: string;
  name: string;
  spriteType: string;
  isCurrentPlayer: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  selected: boolean;
}

export const Sprite: React.FC<SpriteProps> = ({ 
  x, 
  y, 
  message, 
  name,
  spriteType,
  isCurrentPlayer,
  onDragStart,
  selected,
}) => {
  // Get the appropriate sprite component or default to Ghost
  const SpriteIcon = spriteComponents[spriteType as keyof typeof spriteComponents] || Ghost;

  return (
    <div
      className={`absolute select-none
        ${selected ? 'z-10 scale-110' : 'z-0 scale-100'}
        ${isCurrentPlayer ? 'cursor-move hover:scale-110' : 'cursor-default'}
      `}
      style={{ 
        transform: `translate(${x}px, ${y}px)`,
        transition: selected ? 'none' : 'transform 0.2s ease-out',
        touchAction: 'none',
      }}
      onMouseDown={isCurrentPlayer ? onDragStart : undefined}
    >
      {/* Message bubble */}
      {message && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white px-3 py-1 rounded-full shadow-md whitespace-nowrap">
          {message}
        </div>
      )}
      
      {/* Sprite container */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <SpriteIcon 
            size={32} 
            className={`
              ${isCurrentPlayer ? 'text-blue-500' : 'text-gray-500'} 
              ${selected ? 'filter drop-shadow-lg' : ''}
              transition-colors
            `}
          />
          {/* Selection indicator */}
          {selected && (
            <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-pulse" />
          )}
        </div>
        {/* Player name */}
        <span className="mt-1 px-2 py-0.5 bg-white/80 rounded-full text-xs font-medium shadow-sm">
          {name}
        </span>
      </div>
    </div>
  );
};