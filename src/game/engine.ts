/** A deterministic, rendering-independent simulation. All distances use world pixels. */
export type GameStatus = 'ready' | 'running' | 'paused' | 'over';
export type GameEvent = 'jump' | 'cheese' | 'hit' | 'level';
export type ObstacleKind = 'spool' | 'jar' | 'block';
export interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  kind: ObstacleKind;
}
export interface Cheese {
  id: number;
  x: number;
  y: number;
  phase: number;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}
export interface RunResult {
  score: number;
  cheese: number;
  seconds: number;
  distance: number;
}
export interface GameSnapshot extends RunResult {
  status: GameStatus;
  level: number;
  jumping: boolean;
}

export const WORLD_HEIGHT = 400;
export const GRAVITY = 1580;
export const JUMP_VELOCITY = 610;
export const CHEESE_POINTS = 25;
export const FIXED_STEP = 1 / 120;

export class RunnerEngine {
  status: GameStatus = 'ready';
  width = 1000;
  ground = WORLD_HEIGHT - 76;
  playerX = 190;
  playerY = 0;
  velocityY = 0;
  elapsed = 0;
  distance = 0;
  cheese = 0;
  obstacles: Obstacle[] = [];
  cheeses: Cheese[] = [];
  particles: Particle[] = [];
  private obstacleTimer = 1.25;
  private cheeseTimer = 0.5;
  private jumpBuffer = 0;
  private nextId = 1;
  private lastLevel = 1;
  private accumulator = 0;

  constructor(
    private random: () => number = Math.random,
    private onEvent?: (event: GameEvent) => void,
  ) {}

  get speed() {
    return Math.min(445, 225 + this.elapsed * 1.7);
  }
  get score() {
    return Math.floor(this.distance / 12) + this.cheese * CHEESE_POINTS;
  }
  get level() {
    return Math.min(6, 1 + Math.floor(this.elapsed / 20));
  }

  setWidth(width: number) {
    const oldX = this.playerX;
    this.width = Math.max(300, width);
    this.playerX = Math.min(190, this.width * 0.23);
    const change = this.playerX - oldX;
    this.obstacles.forEach((o) => {
      o.x += change;
    });
    this.cheeses.forEach((c) => {
      c.x += change;
    });
  }

  start() {
    this.status = 'running';
    this.playerY =
      this.velocityY =
      this.elapsed =
      this.distance =
      this.cheese =
      this.jumpBuffer =
      this.accumulator =
        0;
    this.obstacles = [];
    this.cheeses = [];
    this.particles = [];
    this.obstacleTimer = 1.25;
    this.cheeseTimer = 0.15;
    this.nextId = this.lastLevel = 1;
  }

  jump() {
    if (this.status !== 'running') return false;
    if (this.playerY > 0) {
      this.jumpBuffer = 0.12;
      return false;
    }
    this.velocityY = JUMP_VELOCITY;
    this.playerY = 0.01;
    this.jumpBuffer = 0;
    this.onEvent?.('jump');
    return true;
  }

  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.accumulator = 0;
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.accumulator = 0;
    }
  }

  snapshot(): GameSnapshot {
    return {
      status: this.status,
      score: this.score,
      cheese: this.cheese,
      seconds: this.elapsed,
      distance: this.distance,
      level: this.level,
      jumping: this.playerY > 0,
    };
  }

  update(dt: number) {
    if (this.status !== 'running') return;
    // Never fast-forward through an obstacle after a stalled/background frame.
    this.accumulator += Math.min(Math.max(dt, 0), 0.1);
    while (this.accumulator >= FIXED_STEP && this.status === 'running') {
      this.step(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }
  }

  private step(dt: number) {
    this.elapsed += dt;
    const dx = this.speed * dt;
    this.distance += dx;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.playerY > 0 || this.velocityY > 0) {
      this.velocityY -= GRAVITY * dt;
      this.playerY = Math.max(0, this.playerY + this.velocityY * dt);
      if (this.playerY === 0) {
        this.velocityY = 0;
        if (this.jumpBuffer > 0) this.jump();
      }
    }

    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      const roll = this.random();
      const kind: ObstacleKind =
        roll < 0.36 ? 'spool' : roll < 0.7 ? 'jar' : 'block';
      const width = kind === 'jar' ? 31 : kind === 'spool' ? 33 : 39;
      const height = kind === 'jar' ? 51 : kind === 'spool' ? 37 : 32;
      const x = this.width + 48;
      this.obstacles.push({ id: this.nextId++, x, width, height, kind });
      // An arcing trail rewards a jump that clears the obstacle.
      this.cheeses.push({
        id: this.nextId++,
        x: x - 20,
        y: this.ground - 83,
        phase: this.random() * 6,
      });
      this.cheeses.push({
        id: this.nextId++,
        x: x + 35,
        y: this.ground - 110,
        phase: this.random() * 6,
      });
      // A minimum gap longer than the entire jump keeps every pattern escapable.
      this.obstacleTimer =
        Math.max(1.28, 1.85 - this.elapsed * 0.0025) + this.random() * 0.65;
    }
    this.cheeseTimer -= dt;
    if (this.cheeseTimer <= 0) {
      this.cheeses.push({
        id: this.nextId++,
        x: this.width + 30,
        y: this.ground - 25,
        phase: this.random() * 6,
      });
      this.cheeseTimer = 2.4 + this.random() * 1.6;
    }

    this.obstacles.forEach((o) => {
      o.x -= dx;
    });
    this.cheeses.forEach((c) => {
      c.x -= dx;
    });
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -30);
    this.cheeses = this.cheeses.filter((c) => c.x > -30);

    // A forgiving inner hitbox follows the body, excluding ears, tail and whiskers.
    const px = this.playerX - 13,
      py = this.ground - this.playerY - 34;
    const pw = 32,
      ph = 31;
    this.cheeses = this.cheeses.filter((c) => {
      if (
        px < c.x + 13 &&
        px + pw > c.x - 13 &&
        py < c.y + 13 &&
        py + ph > c.y - 13
      ) {
        this.cheese++;
        this.onEvent?.('cheese');
        for (let i = 0; i < 7; i++)
          this.particles.push({
            x: c.x,
            y: c.y,
            vx: (this.random() - 0.5) * 130,
            vy: -55 - this.random() * 100,
            life: 0.5,
            maxLife: 0.5,
          });
        return false;
      }
      return true;
    });
    for (const o of this.obstacles) {
      if (
        px + pw > o.x + 4 &&
        px < o.x + o.width - 4 &&
        py + ph > this.ground - o.height + 5 &&
        py < this.ground
      ) {
        this.status = 'over';
        this.onEvent?.('hit');
        break;
      }
    }
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
    });
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.level !== this.lastLevel) {
      this.lastLevel = this.level;
      this.onEvent?.('level');
    }
  }
}
