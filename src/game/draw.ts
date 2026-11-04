import { RunnerEngine, WORLD_HEIGHT } from './engine';
import type { Obstacle } from './engine';

const INK = '#55574f';
const fill = (ctx: CanvasRenderingContext2D, color: string) => {
  ctx.fillStyle = color;
  ctx.fill();
};
function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  fill(ctx, color);
}
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  stroke?: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  fill(ctx, color);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function line(
  ctx: CanvasRenderingContext2D,
  points: number[],
  color: string,
  width = 2,
) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2)
    ctx.lineTo(points[i], points[i + 1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawCheese(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 1,
  rotation = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size, size);
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#b88a2b';
  ctx.beginPath();
  ctx.moveTo(-13, 9);
  ctx.lineTo(-9, -10);
  ctx.lineTo(13, 5);
  ctx.lineTo(13, 12);
  ctx.closePath();
  fill(ctx, '#f6c64a');
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-13, 9);
  ctx.lineTo(13, 5);
  ctx.lineTo(-9, -10);
  ctx.closePath();
  fill(ctx, '#ffdb6b');
  ctx.stroke();
  ellipse(ctx, -5, -2, 2.5, 1.9, '#dbac3f');
  ellipse(ctx, 3, 4, 2.3, 1.5, '#dbac3f');
  ellipse(ctx, -7, 9, 1.5, 1.2, '#d3a136');
  ctx.restore();
}

export function drawMouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stride = 0,
  jumping = false,
  over = false,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Soft little tail, outlined separately from the body.
  ctx.beginPath();
  ctx.moveTo(-27, -25);
  ctx.bezierCurveTo(-53, -23, -45, -8 + Math.sin(stride) * 2, -63, -14);
  ctx.strokeStyle = '#a88b87';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = '#dfb6ae';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  const bob = jumping || over ? 0 : Math.sin(stride * 2) * 1.6;
  ctx.translate(0, bob);
  if (jumping) ctx.rotate(-0.075);
  // Rear ear.
  ctx.lineWidth = 2;
  ellipse(ctx, -1, -51, 11, 12, '#b9bbb6');
  ctx.strokeStyle = INK;
  ctx.stroke();
  ellipse(ctx, -1, -51, 7, 8, '#e2b8ae');
  // Body and its pale tummy.
  ctx.beginPath();
  ctx.ellipse(-6, -26, 29, 20, -0.12, 0, Math.PI * 2);
  fill(ctx, '#aeb2ac');
  ctx.stroke();
  ellipse(ctx, -1, -20, 20, 12, '#d8dad2');
  // Feet have a full running cycle and tuck up when jumping.
  for (const [offset, phase] of [
    [-17, 0],
    [13, Math.PI],
  ]) {
    const dx = jumping ? 1 : Math.sin(stride + phase) * 7;
    const dy = jumping ? -8 : -Math.max(0, Math.cos(stride + phase)) * 4;
    ctx.beginPath();
    ctx.ellipse(offset + dx, -5 + dy, 8, 4.6, -0.08, 0, Math.PI * 2);
    fill(ctx, '#dfb6ae');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  // Pointed nose and round cheeks.
  ctx.beginPath();
  ctx.moveTo(3, -45);
  ctx.bezierCurveTo(14, -58, 31, -50, 38, -39);
  ctx.quadraticCurveTo(44, -37, 47, -31);
  ctx.quadraticCurveTo(36, -18, 15, -22);
  ctx.quadraticCurveTo(4, -26, 3, -45);
  fill(ctx, '#bfc3bb');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Front ear with a highlight.
  ellipse(ctx, 8, -55, 15, 16, '#c6c8c0');
  ctx.stroke();
  ellipse(ctx, 8, -55, 10, 11, '#e3b9b0');
  ctx.beginPath();
  ctx.arc(6, -57, 6.2, 3.5, 5.2);
  ctx.strokeStyle = '#f1d1c9';
  ctx.lineWidth = 2;
  ctx.stroke();
  // The yellow scarf is the mouse's signature detail.
  ctx.beginPath();
  ctx.moveTo(7, -32);
  ctx.lineTo(13, -25);
  ctx.lineTo(1, -21);
  ctx.lineTo(-5, -29);
  ctx.closePath();
  fill(ctx, '#efbe45');
  ctx.strokeStyle = '#a58a40';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, -28);
  ctx.lineTo(-17, -36 + Math.sin(stride) * 2);
  ctx.lineTo(-12, -26);
  ctx.lineTo(-2, -23);
  ctx.closePath();
  fill(ctx, '#f4cc59');
  ctx.stroke();
  // Face, blush, whiskers and nose.
  if (over) {
    line(ctx, [26, -42, 32, -36], INK, 1.8);
    line(ctx, [26, -36, 32, -42], INK, 1.8);
  } else {
    ellipse(ctx, 29, -40, 3.7, 4.2, '#343a35');
    ellipse(ctx, 30, -41.5, 1.2, 1.3, '#fffdf4');
  }
  ellipse(ctx, 35, -31, 4, 2.7, '#dfa69e');
  ellipse(ctx, 46, -32, 3.4, 2.8, '#b27e77');
  ctx.beginPath();
  ctx.arc(38, -31, 4, 0.3, 1.9);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  line(ctx, [38, -30, 52, -26], '#878b7e', 1);
  line(ctx, [38, -33, 53, -34], '#878b7e', 1);
  ctx.restore();
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  ground: number,
) {
  const x = o.x,
    y = ground - o.height,
    w = o.width,
    h = o.height;
  ctx.lineWidth = 1.8;
  ellipse(ctx, x + w / 2, ground + 3, w * 0.65, 4, '#69604412');
  if (o.kind === 'spool') {
    roundRect(ctx, x + 4, y + 6, w - 8, h - 12, 3, '#b2aba2', '#817c72');
    for (let i = 10; i < h - 7; i += 4)
      line(ctx, [x + 5, y + i, x + w - 5, y + i - 1], '#d7d0c4', 1.4);
    roundRect(ctx, x, y, w, 7, 3, '#cbb99b', '#8e806d');
    roundRect(ctx, x, ground - 7, w, 7, 3, '#cbb99b', '#8e806d');
    ellipse(ctx, x + w / 2, y + 2, 4, 1.4, '#8e806d');
  } else if (o.kind === 'jar') {
    roundRect(ctx, x + 2, y + 8, w - 4, h - 8, 6, '#b7c2b4', '#768470');
    roundRect(ctx, x, y + 2, w, 8, 2, '#819477', '#687a60');
    roundRect(ctx, x + 6, y + 21, w - 12, 17, 3, '#f2ecda');
    line(ctx, [x + 12, y + 27, x + w - 11, y + 27], '#aea88f', 1.3);
    line(ctx, [x + 12, y + 31, x + w - 11, y + 31], '#aea88f', 1.3);
    line(ctx, [x + 7, y + 14, x + 7, y + 19], '#dde6d7', 2);
  } else {
    roundRect(ctx, x, y, w, h, 4, '#c7ab8d', '#97816a');
    roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 2, '#d8c5a7');
    line(
      ctx,
      [x + 12, y + h - 9, x + w / 2, y + 9, x + w - 11, y + h - 9],
      '#9e876a',
      2,
    );
    line(ctx, [x + 15, y + h - 14, x + w - 14, y + h - 14], '#9e876a', 2);
  }
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  mobile: boolean,
) {
  ctx.save();
  ctx.globalAlpha = 0.65;
  const w = mobile ? 108 : 142,
    h = mobile ? 173 : 184,
    y = ground - h - 25;
  roundRect(ctx, x, y, w, h, 62, '#e9e8d8');
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, w - 16, h - 16, 55);
  ctx.clip();
  ctx.fillStyle = '#f4efdc';
  ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
  ellipse(ctx, x + w * 0.73, y + 48, 22, 22, '#ead69e');
  ctx.beginPath();
  ctx.moveTo(x, y + h - 31);
  ctx.bezierCurveTo(x + 30, y + h - 60, x + 60, y + h - 18, x + w, y + h - 43);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  fill(ctx, '#dce0c9');
  ctx.beginPath();
  ctx.moveTo(x, y + h - 12);
  ctx.bezierCurveTo(x + 20, y + h - 39, x + 70, y + h - 40, x + w, y + h - 13);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  fill(ctx, '#ced5bb');
  ctx.restore();
  line(ctx, [x + w / 2, y + 8, x + w / 2, y + h - 7], '#e7dfc7', 6);
  line(ctx, [x + 8, y + h * 0.55, x + w - 8, y + h * 0.55], '#e7dfc7', 6);
  roundRect(ctx, x - 8, y + h - 3, w + 16, 9, 4, '#e3dcca');
  ctx.restore();
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.6;
  line(ctx, [0, -28, -3, -97], '#9ba58a', 2);
  for (let i = 0; i < 4; i++) {
    const y = -43 - i * 14,
      side = i % 2 === 0 ? -1 : 1;
    ctx.save();
    ctx.translate(-2, y);
    ctx.rotate(side * 0.7);
    ellipse(ctx, side * 8, -5, 11, 5, '#aab49a');
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(-20, -31);
  ctx.lineTo(20, -31);
  ctx.lineTo(15, -1);
  ctx.quadraticCurveTo(0, 4, -15, -1);
  ctx.closePath();
  fill(ctx, '#d2bbaa');
  roundRect(ctx, -23, -36, 46, 8, 3, '#c7ad98');
  ctx.restore();
}

export function renderGame(
  canvas: HTMLCanvasElement,
  engine: RunnerEngine,
  reduced: boolean,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = engine.width,
    g = engine.ground;
  ctx.setTransform(canvas.width / w, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
  ctx.clearRect(0, 0, w, WORLD_HEIGHT);
  ctx.fillStyle = '#f4f0e5';
  ctx.fillRect(0, 0, w, WORLD_HEIGHT);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Quiet pantry backdrop. Decorative parallax stops with reduced motion.
  const travel = reduced ? 0 : engine.distance * 0.085;
  const cycle = w + 400;
  const wrap = (x: number) => ((x - travel + cycle * 100) % cycle) - 200;
  drawWindow(ctx, wrap(250), g, w < 600);
  if (w > 650) {
    // A small pantry shelf and a trio of softly colored jars.
    const sx = wrap(w * 0.69);
    ctx.globalAlpha = 0.4;
    roundRect(ctx, sx, 146, 174, 7, 3, '#c4b69b');
    line(ctx, [sx + 18, 153, sx + 18, 171], '#c4b69b', 4);
    line(ctx, [sx + 155, 153, sx + 155, 171], '#c4b69b', 4);
    for (let i = 0; i < 3; i++) {
      const jx = sx + 16 + i * 49,
        jh = [48, 63, 42][i];
      roundRect(
        ctx,
        jx,
        146 - jh,
        35,
        jh,
        7,
        ['#c2c8ad', '#d1bba4', '#d8cca8'][i],
      );
      roundRect(ctx, jx - 1, 144 - jh, 37, 7, 2, '#aea58e');
      roundRect(ctx, jx + 6, 160 - jh, 23, 17, 3, '#f6f0df');
    }
    ctx.globalAlpha = 1;
  }
  drawPlant(ctx, wrap(w > 650 ? w - 10 : w + 135), g - 24, w < 600 ? 0.8 : 1);
  // Soft baseboard, wood shelf and warm grain.
  ctx.fillStyle = '#e8e0ce';
  ctx.fillRect(0, g + 1, w, 10);
  ctx.fillStyle = '#ebe3d2';
  ctx.fillRect(0, g + 11, w, WORLD_HEIGHT - g);
  line(ctx, [0, g + 1, w, g + 1], '#c5bba4', 1.3);
  line(ctx, [0, g + 11, w, g + 11], '#ded3bc', 1);
  const floorOffset = engine.distance % 110;
  for (let i = -1; i < w / 110 + 2; i++) {
    const x = i * 110 - floorOffset;
    line(ctx, [x + 15, g + 24, x + 32, g + 24], '#d2c5aa', 1);
    line(ctx, [x + 58, g + 41, x + 92, g + 41], '#d8ccb4', 1);
    ellipse(ctx, x + 70, g - 3, 1.7, 1.1, '#b5a58a');
  }
  if (engine.status === 'ready') {
    drawCheese(ctx, w < 600 ? w - 60 : w * 0.64, g - 23, 1.05, -0.08);
    drawCheese(ctx, w < 600 ? w - 23 : w * 0.64 + 44, g - 51, 0.85, 0.06);
    if (w > 650)
      drawObstacle(
        ctx,
        { id: 0, x: w * 0.79, width: 33, height: 37, kind: 'spool' },
        g,
      );
  }
  engine.obstacles.forEach((o) => drawObstacle(ctx, o, g));
  engine.cheeses.forEach((c) =>
    drawCheese(
      ctx,
      c.x,
      c.y + (reduced ? 0 : Math.sin(engine.elapsed * 4 + c.phase) * 2),
      0.86,
      -0.07,
    ),
  );
  const shadow = Math.max(0.25, 1 - engine.playerY / 180);
  ellipse(ctx, engine.playerX - 2, g + 3, 36 * shadow, 4 * shadow, '#5d533321');
  drawMouse(
    ctx,
    engine.playerX,
    g - engine.playerY,
    engine.distance * 0.09,
    engine.playerY > 0,
    engine.status === 'over',
    1.12,
  );
  if (!reduced)
    for (const p of engine.particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 8);
      ctx.fillStyle = '#d8a52c';
      ctx.fillRect(-2.5, -2.5, 5, 5);
      ctx.restore();
    }
  ctx.globalAlpha = 1;
}
