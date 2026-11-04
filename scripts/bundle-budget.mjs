import { execFileSync } from 'node:child_process';
import { lstat, readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

const LIMIT = 8_388_608;
const files = execFileSync(
  'git',
  [
    '--no-optional-locks',
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
  ],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
const excluded =
  /(^|\/)(node_modules|\.cache|\.vite|\.vite-temp|\.npm|npm-cache|\.npm-cache)(\/|$)/;
const forbidden = /(^|\/)(\.git|\.github)(\/|$)|(^|\/)\.env(?:\.|$)|\.tgz$/;
let total = 0,
  exportBytes = 0;
for (const file of files) {
  assert.ok(
    !excluded.test(file),
    `Generated dependency/cache entered the bundle: ${file}`,
  );
  assert.ok(!forbidden.test(file), `Forbidden or packaging-only path: ${file}`);
  const info = await lstat(file);
  assert.ok(
    info.isFile() && !info.isSymbolicLink(),
    `Non-file or symlink in submission: ${file}`,
  );
  total += info.size;
  if (file.startsWith('dist/')) exportBytes += info.size;
}
const html = await readFile('dist/index.html', 'utf8');
assert.ok(html.includes('Squeek Runner'));
assert.ok(
  !/(?:src|href)=["']\//.test(html),
  'Root-relative asset URL in export',
);
for (const [, path] of html.matchAll(
  /(?:src|href|content)=["'](\.\/[^"']+)["']/g,
))
  await access(`dist/${path.slice(2)}`);
assert.ok(files.includes('dist/index.html'), 'The export is ignored by Git');
assert.ok(files.includes('package-lock.json'), 'Missing lockfile');
for (const required of ['README.md', 'DESIGN.md', 'artifacts/validation.md', 'artifacts/SEPOLIA.md', 'artifacts/browser-validation.json', 'artifacts/design-probe.json', 'artifacts/contrast-validation.json', 'artifacts/export-manifest.json', 'artifacts/screenshots/mobile-ready.png']) {
  assert.ok(files.includes(required), `Required delivery file is ignored or missing: ${required}`);
}
assert.ok(total <= LIMIT, `Bundle exceeds 8 MiB: ${total} bytes`);
const modes = execFileSync(
  'git',
  ['--no-optional-locks', 'ls-files', '--stage'],
  { encoding: 'utf8' },
);
assert.ok(!/^160000 /m.test(modes), 'A Git submodule is present');
console.log(
  JSON.stringify(
    {
      files: files.length,
      totalBytes: total,
      exportBytes,
      limitBytes: LIMIT,
      remainingBytes: LIMIT - total,
      passed: true,
    },
    null,
    2,
  ),
);
