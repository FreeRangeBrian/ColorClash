import { Circle, GameColor, Vector2D, Particle, ArenaConfig, ArenaShape, ArenaSize } from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onGameEnd: (winner: GameColor) => void;
  private circles: Circle[] = [];
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private isRunning = false;
  private currentArena: ArenaConfig;
  
  // Game constants
  private PLAYFIELD_WIDTH = 500;
  private PLAYFIELD_HEIGHT = 500;
  private readonly CIRCLE_SIZE = 25;
  private readonly INITIAL_CIRCLES_PER_COLOR = 100;
  private readonly SPEED = 2.5;
  private readonly SPREAD_RADIUS = 80;
  private readonly MAGNETIC_RANGE = 75; // Range for magnetic forces (3 square lengths)
  private readonly ATTRACTION_FORCE = 0.15; // Force towards prey
  private readonly REPULSION_FORCE = 0.2; // Force away from predators

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onGameEnd: (winner: GameColor) => void) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.onGameEnd = onGameEnd;
    // Initialize with default square medium arena first
    this.currentArena = { shape: 'square', size: 'medium', width: 500, height: 500 };
    // Update playfield dimensions based on canvas size
    this.updateDimensions();
  }

  private updateDimensions(): void {
    // Update arena based on canvas size but preserve shape and size
    const baseSize = Math.min(this.canvas.width, this.canvas.height) - 20;
    this.currentArena = this.createArenaConfig(this.currentArena.shape, this.currentArena.size, baseSize);
    this.PLAYFIELD_WIDTH = this.currentArena.width;
    this.PLAYFIELD_HEIGHT = this.currentArena.height;
  }

  private getRandomArena(): ArenaConfig {
    const shapes: ArenaShape[] = ['square', 'circle', 'hexagon', 'triangle'];
    const sizes: ArenaSize[] = ['small', 'medium', 'large'];
    
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    
    const baseSize = Math.min(this.canvas.width, this.canvas.height) - 20;
    console.log(`Generated arena: ${randomShape} ${randomSize}`); // Debug log
    return this.createArenaConfig(randomShape, randomSize, baseSize);
  }

  private createArenaConfig(shape: ArenaShape, size: ArenaSize, baseSize: number): ArenaConfig {
    let width: number, height: number;
    
    // Adjust size based on size setting
    const sizeMultiplier = {
      small: 0.7,
      medium: 0.85,
      large: 1.0
    }[size];
    
    const adjustedSize = baseSize * sizeMultiplier;
    
    // Set dimensions based on shape
    switch (shape) {
      case 'square':
        width = adjustedSize;
        height = adjustedSize;
        break;
      case 'circle':
        width = adjustedSize;
        height = adjustedSize;
        break;
      case 'hexagon':
        width = adjustedSize;
        height = adjustedSize * 0.866; // Hexagon aspect ratio
        break;
      case 'triangle':
        width = adjustedSize;
        height = adjustedSize * 0.866; // Triangle aspect ratio
        break;
    }
    
    return { shape, size, width, height };
  }

  public setArena(shape: ArenaShape, size: ArenaSize): void {
    const baseSize = Math.min(this.canvas.width, this.canvas.height) - 20;
    this.currentArena = this.createArenaConfig(shape, size, baseSize);
    this.PLAYFIELD_WIDTH = this.currentArena.width;
    this.PLAYFIELD_HEIGHT = this.currentArena.height;
  }

  public startGame(): void {
    // Generate a new random arena for each game
    this.currentArena = this.getRandomArena();
    // Update playfield dimensions based on the new arena
    this.PLAYFIELD_WIDTH = this.currentArena.width;
    this.PLAYFIELD_HEIGHT = this.currentArena.height;
    this.isRunning = true;
    this.initializeCircles();
    this.gameLoop();
  }

  public reset(): void {
    this.isRunning = false;
    this.circles = [];
    this.particles = [];
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearCanvas();
  }

  public destroy(): void {
    this.reset();
  }

  private initializeCircles(): void {
    this.circles = [];
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const halfWidth = this.PLAYFIELD_WIDTH / 2;
    const halfHeight = this.PLAYFIELD_HEIGHT / 2;
    
    // Blue circles - top middle of arena
    this.createCircleGroup('blue', { 
      x: centerX, 
      y: centerY - halfHeight + 50 
    });
    
    // Red circles - bottom left of arena
    this.createCircleGroup('red', { 
      x: centerX - halfWidth + 50, 
      y: centerY + halfHeight - 50 
    });
    
    // Green circles - bottom right of arena
    this.createCircleGroup('green', { 
      x: centerX + halfWidth - 50, 
      y: centerY + halfHeight - 50 
    });
  }

  private createCircleGroup(color: GameColor, center: Vector2D): void {
    for (let i = 0; i < this.INITIAL_CIRCLES_PER_COLOR; i++) {
      // Generate random position within spread radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.SPREAD_RADIUS;
      const x = center.x + Math.cos(angle) * distance;
      const y = center.y + Math.sin(angle) * distance;
      
      // Generate random velocity
      const velocityAngle = Math.random() * Math.PI * 2;
      const vx = Math.cos(velocityAngle) * this.SPEED;
      const vy = Math.sin(velocityAngle) * this.SPEED;
      
      // Clamp position to arena boundaries (centered coordinate system)
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const halfWidth = this.PLAYFIELD_WIDTH / 2;
      const halfHeight = this.PLAYFIELD_HEIGHT / 2;
      
      const clampedX = Math.max(
        centerX - halfWidth + this.CIRCLE_SIZE / 2, 
        Math.min(centerX + halfWidth - this.CIRCLE_SIZE / 2, x)
      );
      const clampedY = Math.max(
        centerY - halfHeight + this.CIRCLE_SIZE / 2, 
        Math.min(centerY + halfHeight - this.CIRCLE_SIZE / 2, y)
      );

      const circle: Circle = {
        id: `${color}-${i}-${Date.now()}`,
        x: clampedX,
        y: clampedY,
        vx,
        vy,
        color,
        size: this.CIRCLE_SIZE
      };
      
      this.circles.push(circle);
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    this.updateCircles();
    this.updateParticles();
    this.checkCollisions();
    this.render();
    this.checkWinCondition();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private updateCircles(): void {
    this.circles.forEach(circle => {
      // Apply magnetic forces
      this.applyMagneticForces(circle);
      
      // Update position
      circle.x += circle.vx;
      circle.y += circle.vy;

      // Handle boundaries based on arena shape
      this.handleArenaBoundaries(circle);
    });
  }

  private applyMagneticForces(currentCircle: Circle): void {
    let totalForceX = 0;
    let totalForceY = 0;

    this.circles.forEach(otherCircle => {
      if (currentCircle.id === otherCircle.id || currentCircle.color === otherCircle.color) {
        return; // Skip self and same color
      }

      // Calculate distance between circles
      const dx = otherCircle.x - currentCircle.x;
      const dy = otherCircle.y - currentCircle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only apply forces within magnetic range
      if (distance > this.MAGNETIC_RANGE || distance === 0) {
        return;
      }

      // Normalize direction vector
      const normalX = dx / distance;
      const normalY = dy / distance;

      // Determine relationship: attraction (chase) or repulsion (flee)
      const relationship = this.getColorRelationship(currentCircle.color, otherCircle.color);
      
      if (relationship === 'attraction') {
        // Chase behavior - attracted to prey
        const force = this.ATTRACTION_FORCE * (1 - distance / this.MAGNETIC_RANGE); // Stronger when closer
        totalForceX += normalX * force;
        totalForceY += normalY * force;
      } else if (relationship === 'repulsion') {
        // Flee behavior - repelled by predators
        const force = this.REPULSION_FORCE * (1 - distance / this.MAGNETIC_RANGE); // Stronger when closer
        totalForceX -= normalX * force;
        totalForceY -= normalY * force;
      }
    });

    // Apply the accumulated forces to velocity
    currentCircle.vx += totalForceX;
    currentCircle.vy += totalForceY;

    // Maintain speed limit to prevent circles from going too fast
    const currentSpeed = Math.sqrt(currentCircle.vx * currentCircle.vx + currentCircle.vy * currentCircle.vy);
    const maxSpeed = this.SPEED * 1.8; // Allow some speed increase from magnetic forces
    
    if (currentSpeed > maxSpeed) {
      const speedRatio = maxSpeed / currentSpeed;
      currentCircle.vx *= speedRatio;
      currentCircle.vy *= speedRatio;
    }
  }

  private getColorRelationship(currentColor: GameColor, otherColor: GameColor): 'attraction' | 'repulsion' | 'neutral' {
    // Blue chases Red, flees from Green
    if (currentColor === 'blue') {
      if (otherColor === 'red') return 'attraction';
      if (otherColor === 'green') return 'repulsion';
    }
    
    // Green chases Blue, flees from Red  
    if (currentColor === 'green') {
      if (otherColor === 'blue') return 'attraction';
      if (otherColor === 'red') return 'repulsion';
    }
    
    // Red chases Green, flees from Blue
    if (currentColor === 'red') {
      if (otherColor === 'green') return 'attraction';
      if (otherColor === 'blue') return 'repulsion';
    }
    
    return 'neutral';
  }

  private handleArenaBoundaries(circle: Circle): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    switch (this.currentArena.shape) {
      case 'square':
        this.handleSquareBoundaries(circle);
        break;
      case 'circle':
        this.handleCircleBoundaries(circle, centerX, centerY);
        break;
      case 'hexagon':
        this.handleHexagonBoundaries(circle, centerX, centerY);
        break;
      case 'triangle':
        this.handleTriangleBoundaries(circle, centerX, centerY);
        break;
    }
  }

  private handleSquareBoundaries(circle: Circle): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const halfWidth = this.PLAYFIELD_WIDTH / 2;
    const halfHeight = this.PLAYFIELD_HEIGHT / 2;
    
    const left = centerX - halfWidth + circle.size / 2;
    const right = centerX + halfWidth - circle.size / 2;
    const top = centerY - halfHeight + circle.size / 2;
    const bottom = centerY + halfHeight - circle.size / 2;
    
    if (circle.x <= left || circle.x >= right) {
      circle.vx = -circle.vx;
      circle.x = Math.max(left, Math.min(right, circle.x));
    }
    
    if (circle.y <= top || circle.y >= bottom) {
      circle.vy = -circle.vy;
      circle.y = Math.max(top, Math.min(bottom, circle.y));
    }
  }

  private handleCircleBoundaries(circle: Circle, centerX: number, centerY: number): void {
    const dx = circle.x - centerX;
    const dy = circle.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = this.PLAYFIELD_WIDTH / 2 - circle.size / 2;
    
    if (distance > radius) {
      // Normalize direction vector
      const normalX = dx / distance;
      const normalY = dy / distance;
      
      // Reflect velocity off the circle boundary
      const dot = circle.vx * normalX + circle.vy * normalY;
      circle.vx = circle.vx - 2 * dot * normalX;
      circle.vy = circle.vy - 2 * dot * normalY;
      
      // Move circle back inside the boundary
      circle.x = centerX + normalX * radius;
      circle.y = centerY + normalY * radius;
    }
  }

  private handleHexagonBoundaries(circle: Circle, centerX: number, centerY: number): void {
    // For simplicity, use circle collision but with hexagon rendering
    this.handleCircleBoundaries(circle, centerX, centerY);
  }

  private handleTriangleBoundaries(circle: Circle, centerX: number, centerY: number): void {
    // For simplicity, use circle collision but with triangle rendering
    this.handleCircleBoundaries(circle, centerX, centerY);
  }

  private updateParticles(): void {
    // Update particle positions and life
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1 / 60; // Assume 60fps, decrease life each frame
      
      // Apply gravity/friction to particles
      particle.vy += 0.1; // slight downward gravity
      particle.vx *= 0.98; // air resistance
      particle.vy *= 0.98;
    });

    // Remove dead particles
    this.particles = this.particles.filter(particle => particle.life > 0);
  }

  private createCollisionParticles(circle1: Circle, circle2: Circle): void {
    const centerX = (circle1.x + circle2.x) / 2;
    const centerY = (circle1.y + circle2.y) / 2;
    const particleCount = 6;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      const size = 3 + Math.random() * 4;
      const life = 0.5 + Math.random() * 0.5;

      // Alternate between the two colliding colors
      const color = i % 2 === 0 ? circle1.color : circle2.color;

      const particle: Particle = {
        id: `collision-${Date.now()}-${i}`,
        x: centerX + (Math.random() - 0.5) * 20,
        y: centerY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size,
        life,
        maxLife: life,
        type: 'collision'
      };

      this.particles.push(particle);
    }
  }

  private createSplitParticles(circle: Circle): void {
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const size = 2 + Math.random() * 3;
      const life = 0.8 + Math.random() * 0.7;

      const particle: Particle = {
        id: `split-${Date.now()}-${i}`,
        x: circle.x + (Math.random() - 0.5) * circle.size,
        y: circle.y + (Math.random() - 0.5) * circle.size,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: circle.color,
        size,
        life,
        maxLife: life,
        type: 'split'
      };

      this.particles.push(particle);
    }
  }

  private checkCollisions(): void {
    const toRemove: Set<string> = new Set();
    const toAdd: Circle[] = [];

    for (let i = 0; i < this.circles.length; i++) {
      for (let j = i + 1; j < this.circles.length; j++) {
        const circle1 = this.circles[i];
        const circle2 = this.circles[j];
        
        if (toRemove.has(circle1.id) || toRemove.has(circle2.id)) continue;

        // Check for collision using circle collision detection
        if (this.isColliding(circle1, circle2)) {
          // Only process collisions between different colors
          if (circle1.color !== circle2.color) {
            // Apply bounce physics to both circles
            this.applyBounce(circle1, circle2);
            
            // Create collision particles
            this.createCollisionParticles(circle1, circle2);
            
            // Resolve battle
            const battle = this.resolveBattle(circle1, circle2);
            
            if (battle.winner && battle.loser) {
              // Create split particles for the winner
              this.createSplitParticles(battle.winner);
              
              // Mark loser for removal
              toRemove.add(battle.loser.id);
              
              // Create new circle from winner (split)
              const newCircle = this.createSplitCircle(battle.winner);
              toAdd.push(newCircle);
            }
          }
          // Same-colored circles pass through each other without any interaction
        }
      }
    }

    // Remove defeated circles
    this.circles = this.circles.filter(circle => !toRemove.has(circle.id));
    
    // Add new circles
    this.circles.push(...toAdd);
  }

  private isColliding(circle1: Circle, circle2: Circle): boolean {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (circle1.size + circle2.size) / 2;
    
    return distance < minDistance;
  }

  private applyBounce(circle1: Circle, circle2: Circle): void {
    // Calculate the collision normal (direction from circle1 to circle2)
    const dx = circle2.x - circle1.x;
    const dy = circle2.y - circle1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Avoid division by zero
    if (distance === 0) return;
    
    // Normalize the collision vector
    const normalX = dx / distance;
    const normalY = dy / distance;
    
    // Store original speeds to maintain momentum
    const speed1 = Math.sqrt(circle1.vx * circle1.vx + circle1.vy * circle1.vy);
    const speed2 = Math.sqrt(circle2.vx * circle2.vx + circle2.vy * circle2.vy);
    
    // Simple reflection: reflect velocities off the collision normal
    // but maintain original speeds
    const dot1 = circle1.vx * normalX + circle1.vy * normalY;
    const dot2 = circle2.vx * normalX + circle2.vy * normalY;
    
    // Reflect velocities
    circle1.vx = circle1.vx - 2 * dot1 * normalX;
    circle1.vy = circle1.vy - 2 * dot1 * normalY;
    circle2.vx = circle2.vx - 2 * dot2 * normalX;
    circle2.vy = circle2.vy - 2 * dot2 * normalY;
    
    // Restore original speeds to maintain momentum
    const newSpeed1 = Math.sqrt(circle1.vx * circle1.vx + circle1.vy * circle1.vy);
    const newSpeed2 = Math.sqrt(circle2.vx * circle2.vx + circle2.vy * circle2.vy);
    
    if (newSpeed1 > 0) {
      circle1.vx = (circle1.vx / newSpeed1) * speed1;
      circle1.vy = (circle1.vy / newSpeed1) * speed1;
    }
    
    if (newSpeed2 > 0) {
      circle2.vx = (circle2.vx / newSpeed2) * speed2;
      circle2.vy = (circle2.vy / newSpeed2) * speed2;
    }
    
    // Separate overlapping circles
    const overlap = (circle1.size + circle2.size) / 2 - distance;
    if (overlap > 0) {
      const separationX = normalX * overlap * 0.5;
      const separationY = normalY * overlap * 0.5;
      
      circle1.x -= separationX;
      circle1.y -= separationY;
      circle2.x += separationX;
      circle2.y += separationY;
    }
  }

  private resolveBattle(circle1: Circle, circle2: Circle): { winner: Circle | null, loser: Circle | null } {
    // Rock-paper-scissors logic: Blue beats Red, Green beats Blue, Red beats Green
    if (
      (circle1.color === 'blue' && circle2.color === 'red') ||
      (circle1.color === 'green' && circle2.color === 'blue') ||
      (circle1.color === 'red' && circle2.color === 'green')
    ) {
      return { winner: circle1, loser: circle2 };
    } else if (
      (circle2.color === 'blue' && circle1.color === 'red') ||
      (circle2.color === 'green' && circle1.color === 'blue') ||
      (circle2.color === 'red' && circle1.color === 'green')
    ) {
      return { winner: circle2, loser: circle1 };
    }
    
    return { winner: null, loser: null };
  }

  private createSplitCircle(originalCircle: Circle): Circle {
    // Create a new circle near the original with slight velocity variation
    const angle = Math.random() * Math.PI * 2;
    const offset = 10;
    
    return {
      id: `${originalCircle.color}-split-${Date.now()}-${Math.random()}`,
      x: originalCircle.x + Math.cos(angle) * offset,
      y: originalCircle.y + Math.sin(angle) * offset,
      vx: originalCircle.vx + (Math.random() - 0.5) * 1,
      vy: originalCircle.vy + (Math.random() - 0.5) * 1,
      color: originalCircle.color,
      size: this.CIRCLE_SIZE
    };
  }

  private render(): void {
    this.clearCanvas();
    
    // Draw arena background and border
    this.drawArena();
    
    // Draw particles first (behind squares)
    this.renderParticles();
    
    // Draw all circles
    this.circles.forEach(circle => {
      this.ctx.fillStyle = this.getCircleColor(circle.color);
      this.ctx.beginPath();
      this.ctx.arc(circle.x, circle.y, circle.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Draw score and arena info
    this.drawScore();
    this.drawArenaInfo();
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawArena(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.strokeStyle = '#fbbf24'; // Yellow border
    this.ctx.lineWidth = 3;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Subtle arena background
    
    // Debug: ensure we're rendering the correct shape
    console.log(`Rendering arena: ${this.currentArena.shape} ${this.currentArena.size}`);
    
    switch (this.currentArena.shape) {
      case 'square':
        this.drawSquareArena(centerX, centerY);
        break;
      case 'circle':
        this.drawCircleArena(centerX, centerY);
        break;
      case 'hexagon':
        this.drawHexagonArena(centerX, centerY);
        break;
      case 'triangle':
        this.drawTriangleArena(centerX, centerY);
        break;
    }
  }

  private drawSquareArena(centerX: number, centerY: number): void {
    const x = centerX - this.PLAYFIELD_WIDTH / 2;
    const y = centerY - this.PLAYFIELD_HEIGHT / 2;
    
    this.ctx.fillRect(x, y, this.PLAYFIELD_WIDTH, this.PLAYFIELD_HEIGHT);
    this.ctx.strokeRect(x, y, this.PLAYFIELD_WIDTH, this.PLAYFIELD_HEIGHT);
  }

  private drawCircleArena(centerX: number, centerY: number): void {
    const radius = this.PLAYFIELD_WIDTH / 2;
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawHexagonArena(centerX: number, centerY: number): void {
    const radius = this.PLAYFIELD_WIDTH / 2;
    
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawTriangleArena(centerX: number, centerY: number): void {
    const radius = this.PLAYFIELD_WIDTH / 2;
    
    this.ctx.beginPath();
    // Equilateral triangle pointing up
    const x1 = centerX;
    const y1 = centerY - radius;
    const x2 = centerX - radius * Math.cos(Math.PI / 6);
    const y2 = centerY + radius * Math.sin(Math.PI / 6);
    const x3 = centerX + radius * Math.cos(Math.PI / 6);
    const y3 = centerY + radius * Math.sin(Math.PI / 6);
    
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawArenaInfo(): void {
    // Draw arena type and size info
    this.ctx.font = '12px Inter, sans-serif';
    this.ctx.fillStyle = '#6b7280';
    this.ctx.textAlign = 'right';
    
    const arenaText = `${this.currentArena.shape.charAt(0).toUpperCase() + this.currentArena.shape.slice(1)} ${this.currentArena.size.charAt(0).toUpperCase() + this.currentArena.size.slice(1)}`;
    this.ctx.fillText(arenaText, this.canvas.width - 10, this.canvas.height - 10);
  }

  private renderParticles(): void {
    this.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife; // Fade out over time
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      
      // Different rendering for different particle types
      if (particle.type === 'collision') {
        // Collision particles are small circles with sparkle effect
        this.ctx.fillStyle = this.getCircleColor(particle.color);
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add a white center sparkle for collision particles
        this.ctx.globalAlpha = alpha * 0.8;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
      } else if (particle.type === 'split') {
        // Split particles are small circles that match the splitting circle
        this.ctx.fillStyle = this.getCircleColor(particle.color);
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }

  private getCircleColor(color: GameColor): string {
    const colors = {
      blue: '#3b82f6',
      red: '#ef4444',
      green: '#22c55e'
    };
    return colors[color];
  }

  private drawScore(): void {
    const counts = this.getColorCounts();
    
    this.ctx.font = '14px Inter, sans-serif';
    this.ctx.textAlign = 'left';
    
    let y = 20;
    Object.entries(counts).forEach(([color, count]) => {
      this.ctx.fillStyle = this.getCircleColor(color as GameColor);
      this.ctx.fillText(`${color.charAt(0).toUpperCase() + color.slice(1)}: ${count}`, 10, y);
      y += 20;
    });
  }

  private getColorCounts(): Record<GameColor, number> {
    const counts: Record<GameColor, number> = { blue: 0, red: 0, green: 0 };
    
    this.circles.forEach(circle => {
      counts[circle.color]++;
    });
    
    return counts;
  }

  private checkWinCondition(): void {
    const counts = this.getColorCounts();
    const activeColors = Object.entries(counts).filter(([_, count]) => count > 0);
    
    if (activeColors.length === 1) {
      const winner = activeColors[0][0] as GameColor;
      this.isRunning = false;
      this.onGameEnd(winner);
    }
  }
}
