import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

const dist = resolve('dist');
const results = [];
const unperformed = [];
const errors = [];
const failedResources = [];
const shots = 'artifacts/screenshots';
await mkdir(shots, { recursive: true });
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};
// One bounded process owns both the subpath preview and its browsers.
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    if (!pathname.startsWith('/preview/')) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(
      dist,
      pathname.slice('/preview/'.length) || 'index.html',
    );
    if (!file.startsWith(dist + sep)) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    res
      .writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      .end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = `${origin}/preview/`;

async function step(browser, name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({
      browser,
      name,
      passed: true,
      durationMs: Date.now() - started,
    });
    console.log(`PASS ${browser}: ${name}`);
  } catch (error) {
    results.push({ browser, name, passed: false, error: error.message });
    throw error;
  }
}
async function pageFor(browser, options = {}) {
  const context = await browser.newContext(options);
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400)
      failedResources.push(response.url().replace(origin, ''));
  });
  return { context, page };
}
const status = (page, name) =>
  page.waitForFunction(
    (expected) =>
      document.querySelector('.game-frame')?.getAttribute('data-status') ===
      expected,
    name,
    { timeout: 12000 },
  );
const score = (page) => page.getByTestId('score').textContent();
async function settle(page) {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  assert.ok(await page.evaluate(() => [...document.fonts].some((font) => font.family.includes('DM Sans Variable') && font.status === 'loaded')), 'Local DM Sans must load');
  await page.getByRole('button', { name: 'Start running' }).waitFor();
}
async function noOverflow(page) {
  assert.ok(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  );
}
async function axe(page) {
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  assert.deepEqual(
    audit.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
}

async function coreFlows(browser, name) {
  const { context, page } = await pageFor(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await step(
    name,
    '390px first screen, complete metadata, relative assets, and accessible ready state',
    async () => {
      await settle(page);
      await noOverflow(page);
      const start = await page
        .getByRole('button', { name: 'Start running' })
        .boundingBox();
      assert.ok(start && start.y + start.height <= 844);
      assert.match(await page.title(), /Squeek Runner/);
      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute('content');
      assert.equal(
        (await context.request.get(new URL(image, url).href)).status(),
        200,
      );
      assert.equal(await page.locator('h1').count(), 1);
      await axe(page);
      if (name === 'Chromium')
        await page.screenshot({
          path: `${shots}/mobile-ready.png`,
          fullPage: true,
        });
    },
  );
  await step(
    name,
    'keyboard start and jump, no page scroll, pause freezes score, resume and restart',
    async () => {
      await page.locator('canvas').focus();
      await page.keyboard.press('Space');
      await status(page, 'running');
      const beforeScroll = await page.evaluate(() => scrollY);
      await page.keyboard.press('ArrowUp');
      await page.waitForFunction(
        () =>
          document
            .querySelector('.game-frame')
            ?.getAttribute('data-jumping') === 'true',
      );
      assert.equal(await page.evaluate(() => scrollY), beforeScroll);
      await page.waitForTimeout(300);
      await page.keyboard.press('p');
      await status(page, 'paused');
      const frozen = await score(page);
      await page.waitForTimeout(300);
      assert.equal(await score(page), frozen);
      await page.getByRole('button', { name: 'Resume running' }).click();
      await status(page, 'running');
      await page.keyboard.press('Escape');
      await status(page, 'paused');
      await page
        .getByRole('button', { name: 'Restart run', exact: true })
        .click();
      await status(page, 'running');
      assert.ok(Number((await score(page)).replaceAll(',', '')) < 10);
    },
  );
  await step(
    name,
    'collision, game over, collected cheese, local leaderboard, persistence, and sound toggle',
    async () => {
      await status(page, 'over');
      const final = Number((await score(page)).replaceAll(',', ''));
      assert.ok(final > 25);
      assert.equal(await page.locator('.score-table tbody tr').count(), 1);
      const stored = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('squeek-runner:v1')),
      );
      assert.equal(stored.runs.length, 1);
      assert.ok(stored.runs[0].cheese >= 1);
      assert.equal(stored.best, final);
      await axe(page);
      if (name === 'Chromium')
        await page.screenshot({ path: `${shots}/mobile-game-over.png` });
      await page.getByRole('button', { name: 'Turn sound on' }).click();
      await page.getByRole('button', { name: 'Turn sound off' }).waitFor();
      await settle(page);
      assert.equal(
        Number(
          (await page.getByTestId('best').textContent()).replaceAll(',', ''),
        ),
        final,
      );
      await page.getByRole('button', { name: 'Turn sound off' }).waitFor();
    },
  );
  await step(
    name,
    'touch scene and visible Jump control both jump',
    async () => {
      await page.getByRole('button', { name: 'Start running' }).click();
      await page.locator('canvas').tap({ position: { x: 35, y: 200 } });
      await page.waitForFunction(
        () =>
          document
            .querySelector('.game-frame')
            ?.getAttribute('data-jumping') === 'true',
      );
      await page.waitForTimeout(900);
      const jump = page.getByRole('button', {
        name: 'Jump Tap or press Space',
      });
      assert.ok(await jump.isVisible());
      assert.ok((await jump.boundingBox()).height >= 44);
      await jump.tap();
      await page.waitForFunction(
        () =>
          document
            .querySelector('.game-frame')
            ?.getAttribute('data-jumping') === 'true',
      );
      await page
        .getByRole('button', { name: 'Pause run', exact: true })
        .click();
    },
  );
  await step(
    name,
    'help dialog pauses gameplay, traps keyboard focus, Escape closes and restores focus',
    async () => {
      const help = page.getByRole('button', { name: 'How to play' });
      await help.click();
      await page
        .getByRole('dialog', { name: 'A little field guide' })
        .waitFor();
      await axe(page);
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        assert.ok(
          await page.evaluate(
            () => !!document.activeElement?.closest('dialog'),
          ),
        );
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
      assert.equal(
        await help.evaluate((el) => el === document.activeElement),
        true,
      );
      await status(page, 'paused');
    },
  );
  await step(
    name,
    'leaderboard tabs reveal honest Sepolia state and support arrow keys',
    async () => {
      await page.getByRole('tab', { name: 'Sepolia' }).click();
      await page
        .getByRole('heading', { name: 'A future finish line' })
        .waitFor();
      assert.match(
        await page.locator('.sepolia-panel').textContent(),
        /No contract is connected/,
      );
      assert.match(
        await page.locator('.network-label').textContent(),
        /11155111/,
      );
      await page.keyboard.press('ArrowLeft');
      assert.equal(
        await page
          .getByRole('tab', { name: 'This browser' })
          .getAttribute('aria-selected'),
        'true',
      );
    },
  );
  await step(
    name,
    'phone wallet sheet contains all four branded open-in paths and closes accessibly',
    async () => {
      await page.evaluate(() => scrollTo(0, 0));
      const connect = page.getByRole('button', {
        name: 'Connect wallet',
        exact: true,
      });
      await connect.click();
      await page.getByRole('dialog', { name: 'Connect a wallet' }).waitFor();
      for (const wallet of [
        'MetaMask',
        'Coinbase Wallet',
        'Rabby',
        'Phantom',
      ]) {
        const link = page.getByRole('link', {
          name: `Open in ${wallet}`,
          exact: true,
        });
        assert.ok(await link.isVisible());
        assert.ok((await link.boundingBox()).height >= 48);
        const target = new URL(await link.getAttribute('href'));
        assert.equal(target.protocol, 'https:');
        assert.ok(decodeURIComponent(target.href).includes('/preview/'));
      }
      assert.equal(
        await page
          .getByRole('button', { name: 'Coinbase Smart Wallet', exact: true })
          .count(),
        1,
      );
      await axe(page);
      await noOverflow(page);
      if (name === 'Chromium')
        await page.screenshot({ path: `${shots}/mobile-wallet.png` });
      await page.keyboard.press('Escape');
      assert.equal(
        await connect.evaluate((el) => el === document.activeElement),
        true,
      );
    },
  );
  await step(
    name,
    '320, 740, and 1440px reflow; reduced motion has no endless decorative animation',
    async () => {
      await settle(page);
      for (const width of [320, 740, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await noOverflow(page);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(
        await page.evaluate(
          () =>
            document
              .getAnimations()
              .filter(
                (a) =>
                  a.effect?.getTiming().iterations === Infinity &&
                  a.playState === 'running',
              ).length,
        ),
        0,
      );
      await page.getByRole('button', { name: 'Start running' }).click();
      await status(page, 'running');
      await page.locator('canvas').focus();
      await page.keyboard.press('Space');
      await page.waitForFunction(
        () =>
          document
            .querySelector('.game-frame')
            ?.getAttribute('data-jumping') === 'true',
      );
      await page.keyboard.press('p');
      await status(page, 'paused');
    },
  );
  await context.close();
}

async function desktopChecks(browser) {
  const { context, page } = await pageFor(browser, {
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  await step(
    'Chromium',
    'desktop ready layout and no-extension recovery',
    async () => {
      await settle(page);
      await noOverflow(page);
      await page.screenshot({
        path: `${shots}/desktop-ready.png`,
        fullPage: true,
      });
      await page
        .getByRole('button', { name: 'Connect wallet', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Browser wallet', exact: true })
        .click();
      await page
        .getByRole('status')
        .filter({ hasText: 'No browser wallet found' })
        .waitFor();
      assert.ok(
        await page.getByRole('link', { name: 'Get MetaMask' }).isVisible(),
      );
      assert.ok(
        await page.getByRole('link', { name: 'Get Rabby' }).isVisible(),
      );
      await page.keyboard.press('Escape');
    },
  );
  await step(
    'Chromium',
    'keyboard focus is visible and 200% text enlargement remains usable',
    async () => {
      await page
        .getByRole('button', { name: 'Connect wallet', exact: true })
        .focus();
      assert.equal(
        await page.evaluate(
          () => getComputedStyle(document.activeElement).outlineStyle,
        ),
        'solid',
      );
      assert.ok(
        Number.parseFloat(
          await page.evaluate(
            () => getComputedStyle(document.activeElement).outlineWidth,
          ),
        ) >= 2,
      );
      await page.screenshot({ path: `${shots}/desktop-focus.png` });
      await page.addStyleTag({
        content: ':root { font-size: 200% !important; }',
      });
      await noOverflow(page);
      const start = page.getByRole('button', { name: 'Start running' });
      assert.ok(await start.isVisible());
      await start.click();
      await status(page, 'running');
    },
  );
  await context.close();
}

async function fixtureChecks(browser) {
  const { context, page } = await pageFor(browser, {
    viewport: { width: 390, height: 844 },
  });
  const fixtureAddress = `0x${randomBytes(20).toString('hex')}`;
  const icons = Object.fromEntries(
    await Promise.all(
      ['metamask', 'rabby'].map(async (id) => [
        id,
        `data:image/svg+xml,${encodeURIComponent(await readFile(`public/wallets/${id}.svg`, 'utf8'))}`,
      ]),
    ),
  );
  await context.addInitScript(
    ({ address, icons }) => {
      // Test-only providers. No account, private key, signature, transaction or external RPC.
      const fixture = {
        methods: [],
        reject: false,
        needAdd: true,
        pending: false,
        resolve: null,
      };
      window.__walletFixture = fixture;
      function provider(name) {
        const listeners = new Map();
        let chain = localStorage.getItem(`fixture-chain-${name}`) || '0x1';
        const emit = (event, value) =>
          (listeners.get(event) || []).forEach((fn) => fn(value));
        return {
          isMetaMask: name === 'MetaMask',
          isRabby: name === 'Rabby',
          on(event, fn) {
            listeners.set(event, [...(listeners.get(event) || []), fn]);
          },
          removeListener(event, fn) {
            listeners.set(
              event,
              (listeners.get(event) || []).filter((f) => f !== fn),
            );
          },
          async request({ method, params }) {
            fixture.methods.push({ name, method, params });
            if (method === 'eth_chainId') return chain;
            if (method === 'eth_accounts')
              return localStorage.getItem(`fixture-authorized-${name}`)
                ? [address]
                : [];
            if (
              method === 'eth_requestAccounts' ||
              method === 'wallet_requestPermissions'
            ) {
              if (fixture.pending)
                await new Promise((resolve) => {
                  fixture.resolve = resolve;
                });
              if (fixture.reject)
                throw Object.assign(new Error('User rejected the request'), {
                  code: 4001,
                });
              localStorage.setItem(`fixture-authorized-${name}`, 'true');
              return method === 'eth_requestAccounts'
                ? [address]
                : [{ parentCapability: 'eth_accounts' }];
            }
            if (method === 'wallet_switchEthereumChain') {
              if (fixture.needAdd)
                throw Object.assign(new Error('Unknown chain'), { code: 4902 });
              chain = params[0].chainId;
              localStorage.setItem(`fixture-chain-${name}`, chain);
              emit('chainChanged', chain);
              return null;
            }
            if (method === 'wallet_addEthereumChain') {
              fixture.needAdd = false;
              chain = params[0].chainId;
              localStorage.setItem(`fixture-chain-${name}`, chain);
              emit('chainChanged', chain);
              return null;
            }
            if (method === 'wallet_revokePermissions') {
              localStorage.removeItem(`fixture-authorized-${name}`);
              return null;
            }
            throw Object.assign(
              new Error(`Unsupported fixture method ${method}`),
              { code: -32601 },
            );
          },
        };
      }
      const providers = [
        {
          info: {
            uuid: crypto.randomUUID(),
            name: 'MetaMask',
            icon: icons.metamask,
            rdns: 'io.metamask',
          },
          provider: provider('MetaMask'),
        },
        {
          info: {
            uuid: crypto.randomUUID(),
            name: 'Rabby',
            icon: icons.rabby,
            rdns: 'io.rabby',
          },
          provider: provider('Rabby'),
        },
      ];
      window.ethereum = providers[0].provider;
      const announce = () =>
        providers.forEach((detail) =>
          dispatchEvent(
            new CustomEvent('eip6963:announceProvider', { detail }),
          ),
        );
      addEventListener('eip6963:requestProvider', announce);
      setTimeout(announce, 0);
    },
    { address: fixtureAddress, icons },
  );
  await step(
    'Chromium (simulated providers)',
    'EIP-6963 lists MetaMask and Rabby separately; pending and rejected connection states recover',
    async () => {
      await settle(page);
      await page
        .getByRole('button', { name: 'Connect wallet', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'MetaMask', exact: true })
        .waitFor();
      await page.getByRole('button', { name: 'Rabby', exact: true }).waitFor();
      assert.equal(
        await page
          .getByRole('button', { name: 'Browser wallet', exact: true })
          .count(),
        0,
      );
      await page.evaluate(() => {
        window.__walletFixture.pending = true;
        window.__walletFixture.reject = true;
      });
      await page.getByRole('button', { name: 'MetaMask', exact: true }).click();
      await page.getByText('Check your wallet…', { exact: true }).waitFor();
      assert.equal(
        await page
          .getByRole('button', { name: 'Rabby', exact: true })
          .isDisabled(),
        true,
      );
      await page.evaluate(() => {
        window.__walletFixture.pending = false;
        window.__walletFixture.resolve();
      });
      await page
        .getByText('Connection declined. Choose a wallet to try again.', {
          exact: true,
        })
        .waitFor();
      await page.evaluate(() => {
        window.__walletFixture.reject = false;
      });
      await page.getByRole('button', { name: 'Rabby', exact: true }).click();
      await page
        .getByRole('button', { name: 'Switch to Sepolia', exact: true })
        .waitFor();
    },
  );
  await step(
    'Chromium (simulated providers)',
    'wrong-network detection; Sepolia switch and unknown-chain add fallback use the correct chain',
    async () => {
      await page
        .getByRole('button', { name: 'Switch to Sepolia', exact: true })
        .click();
      await page
        .getByText('Ethereum Sepolia is selected. Scores are still local.', {
          exact: true,
        })
        .waitFor();
      const methods = await page.evaluate(() => window.__walletFixture.methods);
      assert.ok(
        methods.some(
          (m) =>
            m.method === 'wallet_switchEthereumChain' &&
            m.params[0].chainId === '0xaa36a7',
        ),
      );
      const added = methods.find((m) => m.method === 'wallet_addEthereumChain');
      assert.ok(added);
      assert.equal(added.params[0].chainId, '0xaa36a7');
      assert.equal(added.params[0].chainName, 'Sepolia');
      assert.ok(
        added.params[0].rpcUrls.includes(
          'https://ethereum-sepolia-rpc.publicnode.com',
        ),
      );
      assert.equal(
        methods.some((m) => /sendTransaction|sign|sendRaw/i.test(m.method)),
        false,
      );
      await axe(page);
      await noOverflow(page);
      await page.screenshot({ path: `${shots}/wallet-connected.png` });
      await page.keyboard.press('Escape');
    },
  );
  await step(
    'Chromium (simulated providers)',
    'connection survives reload, wallet address labels only a new local run, full address is reachable, disconnect works',
    async () => {
      await settle(page);
      await page.getByRole('button', { name: /0x.*…/ }).waitFor();
      await page.getByRole('button', { name: 'Start running' }).click();
      await status(page, 'over');
      const saved = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('squeek-runner:v1')),
      );
      assert.equal(
        saved.runs[0].address.toLowerCase(),
        fixtureAddress.toLowerCase(),
      );
      await page
        .getByRole('button', {
          name: `View player address ${saved.runs[0].address}`,
        })
        .click();
      assert.equal(
        (await page.locator('.full-address').textContent()).toLowerCase(),
        fixtureAddress.toLowerCase(),
      );
      await page.keyboard.press('Escape');
      await page.evaluate(() => scrollTo(0, 0));
      await page.getByRole('button', { name: /0x.*…/ }).click();
      await page
        .getByRole('button', { name: 'Disconnect wallet', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Connect wallet', exact: true })
        .waitFor();
    },
  );
  await context.close();
}

async function blockedStorage(browser) {
  const { context, page } = await pageFor(browser, {
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage blocked', 'SecurityError');
      },
    }),
  );
  await step(
    'Chromium',
    'blocked browser storage still allows gameplay and gives an honest save limitation',
    async () => {
      await settle(page);
      await page.getByRole('button', { name: 'Start running' }).click();
      await status(page, 'over');
      await page
        .getByText('Storage is unavailable.', { exact: false })
        .waitFor();
      assert.equal(await page.locator('.score-table tbody tr').count(), 1);
      await page.getByRole('button', { name: 'Run again' }).click();
      await status(page, 'running');
    },
  );
  await context.close();
}

let failure = null;
let chromiumBrowser, webkitBrowser;
try {
  chromiumBrowser = await chromium.launch({ headless: true });
  await coreFlows(chromiumBrowser, 'Chromium');
  await desktopChecks(chromiumBrowser);
  await fixtureChecks(chromiumBrowser);
  await blockedStorage(chromiumBrowser);
  try {
    webkitBrowser = await webkit.launch({ headless: true });
  } catch (error) {
    unperformed.push({
      browser: 'WebKit',
      reason: /missing dependencies|Missing libraries/.test(error.message)
        ? 'The browser runtime could not start because required system libraries are missing.'
        : 'The browser runtime could not start. Install the Playwright WebKit browser and its system dependencies.',
    });
    console.log('NOT PERFORMED WebKit: browser runtime unavailable.');
    if (process.argv.includes('--require-webkit')) throw error;
  }
  if (webkitBrowser) await coreFlows(webkitBrowser, 'WebKit');
  assert.deepEqual(errors, [], 'browser console / page errors');
  assert.deepEqual(failedResources, [], 'missing production resources');
  console.log(
    `${results.filter((r) => r.passed).length} production-browser checks passed; ${unperformed.length} browser runtime unavailable.`,
  );
} catch (error) {
  failure = error;
  console.error(error);
} finally {
  await chromiumBrowser?.close();
  await webkitBrowser?.close();
  await new Promise((done) => server.close(done));
  await writeFile(
    'artifacts/browser-validation.json',
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        target: 'dist/ served at /preview/',
        results,
        unperformed,
        errors,
        failedResources,
        limitation:
          'Simulated wallet providers; no real wallet approvals, passkey creation, mobile app handoff, screen-reader session, or physical device test.',
        allExecutedChecksPassed: !failure,
      },
      null,
      2,
    ) + '\n',
  );
}
if (failure) process.exitCode = 1;
