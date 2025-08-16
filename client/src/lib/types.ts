export type GamePhase = 'ready' | 'betting' | 'playing' | 'ended' | 'broke';
export type GameColor = 'blue' | 'red' | 'green';
export type ArenaShape = 'square' | 'circle' | 'hexagon' | 'triangle';
export type ArenaSize = 'small' | 'medium' | 'large';

export interface BettingState {
  bank: number;
  wager: number;
  predictedWinner: GameColor | null;
}

export interface Circle {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  color: GameColor;
  size: number; // diameter
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: GameColor;
  size: number; // diameter
  life: number; // 0-1, 1 being fully alive
  maxLife: number; // initial life duration
  type: 'collision' | 'split';
}

export interface ArenaConfig {
  shape: ArenaShape;
  size: ArenaSize;
  width: number;
  height: number;
}
