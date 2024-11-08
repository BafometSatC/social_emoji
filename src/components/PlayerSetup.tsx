import React, { useState } from 'react';
import { Ghost, Bot, Skull, Bird, Cat, Dog } from 'lucide-react';

interface SpriteOption {
  type: string;
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
}

const spriteOptions: SpriteOption[] = [
  { type: 'ghost', icon: Ghost, label: 'Ghost' },
  { type: 'robot', icon: Bot, label: 'Robot' },
  { type: 'skull', icon: Skull, label: 'Skull' },
  { type: 'bird', icon: Bird, label: 'Bird' },
  { type: 'cat', icon: Cat, label: 'Cat' },
  { type: 'dog', icon: Dog, label: 'Dog' },
];

interface PlayerSetupProps {
  onComplete: (name: string, spriteType: string) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedSprite, setSelectedSprite] = useState('ghost');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim(), selectedSprite);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Join Game</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Your Character
            </label>
            <div className="grid grid-cols-3 gap-3">
              {spriteOptions.map((sprite) => (
                <button
                  key={sprite.type}
                  type="button"
                  onClick={() => setSelectedSprite(sprite.type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedSprite === sprite.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <sprite.icon
                    size={32}
                    className={`mx-auto mb-2 ${
                      selectedSprite === sprite.type ? 'text-blue-500' : 'text-gray-600'
                    }`}
                  />
                  <span className="block text-sm text-center">{sprite.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Join Game
          </button>
        </form>
      </div>
    </div>
  );
};