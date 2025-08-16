import { useEffect, useRef } from 'react';
import { GameEngine } from '../lib/gameEngine';
import { GamePhase, GameColor } from '../lib/types';

interface GameCanvasProps {
  gamePhase: GamePhase;
  onGameEnd: (winner: GameColor) => void;
}

export function GameCanvas({ gamePhase, onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to square based on screen height, leaving room for UI bars
    const updateCanvasSize = () => {
      const titleBarHeight = 60;
      const rulesBarHeight = 80; // Measured actual height
      const margins = 40; // Extra margins for spacing
      const uiHeight = titleBarHeight + rulesBarHeight + margins;
      const availableHeight = window.innerHeight - uiHeight;
      const size = Math.min(availableHeight, window.innerWidth - 40); // Leave some margin
      canvas.width = size;
      canvas.height = size;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvas, ctx, onGameEnd);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, [onGameEnd]);

  useEffect(() => {
    if (gameEngineRef.current) {
      if (gamePhase === 'playing') {
        gameEngineRef.current.startGame();
      } else if (gamePhase === 'ready') {
        gameEngineRef.current.reset();
      }
    }
  }, [gamePhase]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        marginTop: '0px', // Center between top and bottom bars
        padding: '5px',
        background: '#fbbf24', // Outer yellow border
        borderRadius: '3px',
        zIndex: 1
      }}
    >
      <canvas
        ref={canvasRef}
        className="border-0"
        style={{
          background: '#ffffff',
          border: '5px solid #fbbf24', // Inner yellow border
          display: 'block'
        }}
      />
    </div>
  );
}