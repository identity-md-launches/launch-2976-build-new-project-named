import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RunnerEngine,
  CHEESE_POINTS,
  JUMP_VELOCITY,
  GRAVITY,
} from '../src/game/engine';

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function advance(game: RunnerEngine, seconds: number, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) game.update(1 / fps);
}

test('the runner cannot move before starting; pause freezes every game counter', () => {
  const game = new RunnerEngine(seeded(1));
  assert.equal(game.jump(), false);
  advance(game, 1);
  assert.equal(game.distance, 0);
  game.start();
  advance(game, 0.5);
  assert.ok(game.score > 0);
  game.jump();
  advance(game, 0.1);
  game.pause();
  const before = JSON.stringify({
    ...game.snapshot(),
    y: game.playerY,
    obstacles: game.obstacles,
    cheeses: game.cheeses,
  });
  advance(game, 30);
  assert.equal(
    JSON.stringify({
      ...game.snapshot(),
      y: game.playerY,
      obstacles: game.obstacles,
      cheeses: game.cheeses,
    }),
    before,
  );
  assert.equal(game.jump(), false);
  game.resume();
  advance(game, 0.1);
  assert.ok(game.elapsed > 0.6);
});

test('jump follows an arc, cannot double jump, and lands on the shelf', () => {
  const game = new RunnerEngine(seeded(2));
  game.start();
  assert.equal(game.jump(), true);
  advance(game, 0.3);
  assert.ok(game.playerY > 90);
  const velocity = game.velocityY;
  assert.equal(game.jump(), false);
  assert.equal(game.velocityY, velocity);
  advance(game, 0.7);
  assert.equal(game.playerY, 0);
  assert.equal(game.velocityY, 0);
  assert.ok(JUMP_VELOCITY ** 2 / (2 * GRAVITY) > 110);
});

test('a jump just before landing is buffered instead of being dropped', () => {
  const game = new RunnerEngine(seeded(3));
  game.start();
  game.jump();
  advance(game, 0.7);
  assert.ok(game.playerY > 0);
  assert.equal(game.jump(), false);
  advance(game, 0.16);
  assert.ok(game.playerY > 20);
  assert.ok(game.velocityY > 0);
});

test('collectibles award exactly 25 bonus points and cannot be collected twice', () => {
  const events: string[] = [];
  const game = new RunnerEngine(seeded(4), (event) => events.push(event));
  game.start();
  game.cheeses.push({
    id: 991,
    x: game.playerX,
    y: game.ground - 24,
    phase: 0,
  });
  game.update(1 / 60);
  assert.equal(game.cheese, 1);
  assert.equal(game.score, CHEESE_POINTS);
  advance(game, 0.3);
  assert.equal(game.cheese, 1);
  assert.equal(events.filter((x) => x === 'cheese').length, 1);
});

test('an obstacle collision ends the run once; restart resets the whole run', () => {
  const events: string[] = [];
  const game = new RunnerEngine(seeded(5), (event) => events.push(event));
  game.start();
  game.obstacles.push({
    id: 992,
    x: game.playerX,
    width: 32,
    height: 50,
    kind: 'jar',
  });
  game.update(1 / 60);
  assert.equal(game.status, 'over');
  const score = game.score;
  advance(game, 2);
  assert.equal(game.score, score);
  assert.equal(events.filter((x) => x === 'hit').length, 1);
  game.start();
  assert.equal(game.status, 'running');
  assert.equal(game.score, 0);
  assert.equal(game.cheese, 0);
  assert.equal(game.obstacles.length, 0);
  assert.equal(game.particles.length, 0);
});

test('frame timing changes do not alter the simulation outcome', () => {
  const slow = new RunnerEngine(seeded(6)),
    fast = new RunnerEngine(seeded(6));
  slow.setWidth(1000);
  fast.setWidth(1000);
  slow.start();
  fast.start();
  advance(slow, 1, 20);
  advance(fast, 1, 120);
  assert.ok(Math.abs(slow.distance - fast.distance) < 0.01);
  assert.equal(slow.score, fast.score);
  assert.equal(slow.cheeses.length, fast.cheeses.length);
});

test('resizing preserves obstacle distance to the mouse rather than teleporting hazards', () => {
  const game = new RunnerEngine(seeded(7));
  game.start();
  game.obstacles.push({ id: 1, x: 500, width: 30, height: 40, kind: 'spool' });
  const gap = game.obstacles[0].x - game.playerX;
  game.setWidth(340);
  assert.equal(game.obstacles[0].x - game.playerX, gap);
  game.setWidth(1300);
  assert.equal(game.obstacles[0].x - game.playerX, gap);
});

test('random patterns stay jumpable for two simulated minutes at phone and desktop widths', () => {
  for (const width of [340, 400, 1100])
    for (const seed of [17, 327, 8091]) {
      const game = new RunnerEngine(seeded(seed));
      game.setWidth(width);
      game.start();
      const kinds = new Set<string>();
      for (let frame = 0; frame < 120 * 120; frame++) {
        const next = game.obstacles.find(
          (o) => o.x + o.width > game.playerX - 13,
        );
        if (next) {
          kinds.add(next.kind);
          if (
            next.x - game.playerX < game.speed * 0.25 &&
            next.x > game.playerX &&
            game.playerY === 0
          )
            game.jump();
        }
        game.update(1 / 120);
        assert.equal(
          game.status,
          'running',
          `unavoidable pattern: width=${width}, seed=${seed}, t=${game.elapsed}`,
        );
      }
      assert.equal(game.level, 6);
      assert.ok(game.speed > 400);
      assert.ok(game.cheese > 20);
      assert.equal(kinds.size, 3);
      assert.ok(game.score > 2000);
    }
});

test('a long suspended frame is capped rather than fast-forwarded through hazards', () => {
  const game = new RunnerEngine(seeded(9));
  game.start();
  game.update(12);
  assert.ok(game.elapsed <= 0.101);
  assert.equal(game.status, 'running');
});
