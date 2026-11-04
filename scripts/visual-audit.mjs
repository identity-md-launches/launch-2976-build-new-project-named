import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    const file = resolve(root, path.slice(1) || 'index.html');
    if (!file.startsWith(root + '/')) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      'Content-Type',
      types[extname(file)] || 'application/octet-stream',
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  const page = await browser.newPage();
  for (const width of [320, 390, 740, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => document.fonts.ready);
    const contrasts = await page.evaluate(() => {
      const canvas = document.querySelector('canvas'),
        cr = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const rgba = (s) => s.match(/[\d.]+/g)?.map(Number) || [];
      const luminance = (color) =>
        color
          .slice(0, 3)
          .map((n) => n / 255)
          .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
          .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
      const contrast = (a, b) => {
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const targets = document.querySelectorAll(
        '.score-cell > span, .score-cell > strong, .game-menu > h2, .game-menu > p, .game-menu > button, .menu-hint, .scene-caption > span',
      );
      return [...targets]
        .filter((el) => el.checkVisibility())
        .map((el) => {
          const cs = getComputedStyle(el),
            fg = rgba(cs.color),
            rect = el.getBoundingClientRect();
          let minimum = Infinity,
            backdrop = [];
          const own = rgba(cs.backgroundColor);
          if (own.length && (own[3] ?? 1) > 0.99) {
            minimum = contrast(fg, own);
            backdrop = own.slice(0, 3);
          } else {
            for (let x = rect.left; x < rect.right; x += 2)
              for (let y = rect.top; y < rect.bottom; y += 2) {
                const cx = Math.max(
                  0,
                  Math.min(
                    canvas.width - 1,
                    Math.floor(((x - cr.left) / cr.width) * canvas.width),
                  ),
                );
                const cy = Math.max(
                  0,
                  Math.min(
                    canvas.height - 1,
                    Math.floor(((y - cr.top) / cr.height) * canvas.height),
                  ),
                );
                const pixel = [...ctx.getImageData(cx, cy, 1, 1).data];
                const ratio = contrast(fg, pixel);
                if (ratio < minimum) {
                  minimum = ratio;
                  backdrop = pixel.slice(0, 3);
                }
              }
          }
          const size = parseFloat(cs.fontSize),
            weight = parseFloat(cs.fontWeight);
          const threshold =
            size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
          return {
            text: el.textContent.trim(),
            foreground: fg.slice(0, 3),
            worstBackground: backdrop,
            minimumRatio: Math.round(minimum * 100) / 100,
            threshold,
            passed: minimum >= threshold,
          };
        });
    });
    results.push({ width, contrasts });
    const failures = contrasts.filter((r) => !r.passed);
    console.log(
      `${width}px canvas/UI contrast: ${contrasts.length - failures.length}/${contrasts.length} pass`,
    );
    if (failures.length) console.log(JSON.stringify(failures, null, 2));
  }
  await writeFile(
    'artifacts/contrast-validation.json',
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        method:
          'Computed text foreground against actual canvas pixels sampled every 2 CSS px across each text box, or opaque control background. Ready state only; antialiasing excluded by WCAG calculation.',
        results,
      },
      null,
      2,
    ) + '\n',
  );
  assert.ok(
    results.every((r) => r.contrasts.every((c) => c.passed)),
    'Canvas-overlaid text must meet WCAG contrast',
  );
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
