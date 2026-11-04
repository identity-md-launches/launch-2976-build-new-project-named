# Squeek Runner

A complete, free 2D endless runner: a little mouse, a sunlit pantry, and one more piece of cheese. Built with React, TypeScript, Vite, and a Canvas 2D simulation. The finished static site is included in **`dist/`**.

## Run it

Use Node.js **22.12+** (Node 24 was used for validation) and npm.

```sh
npm ci
npm run dev
```

For the production website:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Open the local URL Vite prints. `npm run build` replaces `dist/` with the complete production export. It needs no key, account, environment file, or backend. The lockfile pins the dependencies. Development dependencies and caches are excluded from the submission.

## Play

Choose **Start running**. Press **Space** or **↑** to jump, or tap the scene on a phone. A separate **Jump** button appears on touch devices during a run. **P**, **Escape**, and the pause control pause or resume. Help, wallet connection, changing browser tabs, and leaving the window pause an active run. Use **Resume running**, **Restart run**, or **Run again** as appropriate.

The mouse clears three randomly selected obstacles: spools, jars, and wooden blocks. Distance earns points; each cheese adds **25**. Speed increases with active run time, and the pace label changes every 20 seconds. Jump buffering and generous inner hitboxes make timing forgiving. One collision ends a run.

Sound starts off. The speaker control enables synthesized jump, cheese, level, and collision effects after a user gesture. No sound files or music stream are needed. Reduced-motion mode removes decorative parallax, floating collectibles, collection particles, and button movement; essential gameplay continues after you start it.

## Scores and wallets

**This browser** is a real local leaderboard, initially empty. It displays the top five runs and retains up to ten. Best score and sound preference persist in local storage under `squeek-runner:v1`. Blocked/full storage falls back to the current visit and displays a saving limitation. There are no seeded players, global rankings, analytics, prizes, or fake transactions.

Wallets are optional. The header's connection sheet supports:

- MetaMask, Rabby, and other browser wallets discovered separately through EIP-6963, with a generic browser-wallet fallback.
- Phone links that open this same page inside MetaMask, Coinbase Wallet, Rabby, or Phantom.
- Coinbase Wallet / Coinbase Smart Wallet through its SDK, without a relay or project ID.

The connected address labels **new runs started while connected**, even if the wallet is disconnected later. Stored addresses are selectable in a full-address dialog. Disconnecting does not erase existing local scores. Wallet sessions use the `squeek-wallet` storage namespace and fall back to memory if storage is blocked.

Network detection expects **Ethereum Sepolia, chain ID `11155111` (`0xaa36a7`)**. The wrong-network control requests a switch and uses the standard add-network fallback if needed. The configured public RPC is `https://ethereum-sepolia-rpc.publicnode.com`; gameplay does not call an RPC. Connecting requests a public address, never a signature or transaction.

**The Sepolia leaderboard is not implemented.** Its tab explicitly states that no contract is connected and no scores are sent. `leaderboardDeployment` is deliberately `null`. Local scores are editable browser data and are not verified blockchain records. See [the extension guide](artifacts/SEPOLIA.md) before adding a contract or score submission.

## Static hosting and IPFS

Publish the **contents of `dist/`** as one directory. Vite's `base: './'`, relative font/image/script URLs, and single-page/hash navigation support both an IPFS gateway subpath and a normal static host. Required art, font, wallet marks, and the 1200 × 630 share image are local. There is no runtime CDN dependency for gameplay.

This delivery supplies the ready-to-pin export. The contributor network pins and names that export after submission; no CID or live deployment is invented here. Wallet deep links use the eventual page URL automatically. Use HTTPS on a public gateway for wallet and clipboard features. Browser storage belongs to the serving origin; a different gateway or cleared site data may start with a different local board.

## Project map

| Path | Purpose |
| --- | --- |
| `src/game/engine.ts` | Fixed-step simulation, jump physics, randomized fair patterns, collisions, scoring, difficulty |
| `src/game/draw.ts` | Original mouse, cheese, obstacles, pantry, and animation rendering |
| `src/game/audio.ts` | Small, gesture-activated Web Audio effects |
| `src/components/Game.tsx` | Input, canvas lifecycle, HUD, game states, announcements |
| `src/lib/storage.ts` | Validated, versioned local records and persistence fallback |
| `src/wallet/` | Sepolia configuration, EIP-6963 connectors, branded sheet, mobile links |
| `src/components/Leaderboard.tsx` | Separate local and unavailable-on-chain views |
| `src/components/Modal.tsx` | Native modal, focus cycling, Escape/backdrop close, focus return |
| `src/styles.css`, `DESIGN.md` | Implemented tokens and responsive component system |
| `public/`, `src/assets/social.svg` | Runtime assets and editable share-card source |
| `dist/` | Complete production website; intentionally included in the submission |
| `test/`, `scripts/` | Simulation, storage, production interaction, contrast, and bundle checks |
| `artifacts/` | Actual validation results, review findings, screenshots, and extension notes |

## Validation

The final worker run completed the production build and typecheck, **13 simulation/storage tests**, **14 Chromium production interaction checks**, **16/16 pinned design checks**, and **38/38 additional canvas-overlay contrast measurements** across 320, 390, 740, and 1440 pixels. The browser checks serve the actual export at `/preview/`, block external requests, run axe on key states, and report zero browser console/page errors and missing production resources.

The tests cover start, jump, touch, pause, frozen score, resume, restart, cheese collection, game over, persistence, sound setting, dialogs and focus return, tabs, empty data, blocked storage, both discovered wallets, pending/rejected connections, reconnect, address attribution, network switching, add-network fallback, and disconnect. Wallet checks use **simulated EIP-1193 providers**, not real accounts.

WebKit was attempted but could not launch because its system libraries were missing. The managed browser tool also lacked its configured Chrome executable, so inspection used the working Playwright Chromium runtime. **Real Safari/iOS, installed-wallet approval prompts, passkey creation, mobile app handoff, audible sound quality, and screen-reader sessions remain unverified.** The 200% check enlarged text; it was not native browser zoom. Details, findings, and evidence are in [artifacts/validation.md](artifacts/validation.md).

To repeat the delivered browser and contrast checks on a machine with browser dependencies:

```sh
npx playwright install --with-deps chromium webkit
npm run build
npm run test:browser
node scripts/visual-audit.mjs
npm run check:bundle
```

`test:browser` reports unavailable WebKit coverage explicitly; use `npm run test:browser -- --require-webkit` to require its launch. If using preinstalled browsers, point Playwright at their cache with its standard `PLAYWRIGHT_BROWSERS_PATH` setting. `node scripts/make-social.mjs` regenerates the PNG from the editable SVG; the normal build uses the included PNG and does not require a browser.

The build emits one nonfatal warning about `node:worker_threads` in an unused `ox` Tempo dependency path. Production gameplay and tested wallet paths load without errors. No Tempo connector is configured. Worker results describe checks actually run and are not independent certification.

## Submission budget and credits

The submission limit is **8,388,608 bytes**; the complete delivery is about **1.40 MiB**. `npm run check:bundle` totals every Git-visible source, documentation, asset, and export file, verifies relative HTML assets and required documentation, and refuses dependency/cache files, archives, symlinks, and submodules. The explicit ignore-file budget is **`.gitignore`: at most 1,024 bytes** (currently 269). It excludes `node_modules`, build/package caches at every nesting level, scratch testing, and browser reports, and explicitly includes `artifacts/` to override the repository's existing exclusion. `dist/` and runtime assets remain included. No npm registry or dependency tarballs are delivered.

Game illustrations and SVG interface icons are original to this project. DM Sans is bundled under the [SIL Open Font License](public/licenses/DM-Sans-OFL.txt). MetaMask, Rabby, and Phantom marks are from RainbowKit 2.2.11; its [MIT notice](public/licenses/RainbowKit-MIT.txt) is included. Wallet marks remain their owners' trademarks. The Coinbase mark follows the pinned connector reference.

Design and documentation review used Jakub Krehel's Better Interface (MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`) and Paul Bakaus's Impeccable documentation method (Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`), adapted for this project. Both [license texts](artifacts/Design-guidance-LICENSE.txt) and [attribution notice](artifacts/NOTICE.md) are retained.
