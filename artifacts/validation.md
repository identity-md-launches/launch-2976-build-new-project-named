# Squeek Runner validation and design review

Reviewed 2026-11-04. These are checks performed by the implementation worker, not independent certification. The authoritative product deliverable is the source plus the complete `dist/` export.

## Result

| Area | Actual result |
| --- | --- |
| Production build | Passed, exit 0, Vite 8.3.5 |
| TypeScript | Passed, exit 0, `tsc --noEmit` |
| Simulation/storage | 13/13 tests passed, exit 0 |
| Production Chromium interactions | 14/14 checks passed, exit 0 |
| Browser errors / failed local resources | 0 / 0 in the production interaction run |
| Automated accessibility | No axe WCAG A/AA violations in checked ready, game-over, help, phone-wallet, and connected-wallet states |
| Pinned taste@1 | 16/16 checks passed, exit 0 |
| Extra ready-state canvas/text contrast | 38/38 cases passed across four widths; lowest ratio 4.82:1 |
| Submission file/byte check | Passed: 65 Git-visible files, approximately 1.40 MiB including documentation and screenshots; below 8 MiB |
| First screen at 390 × 844 | Product, real scene, and Start running visible together |
| WebKit | Attempted; runtime unavailable due missing system libraries |
| Managed browser tool | Attempted; its configured Chrome executable was unavailable. Used installed Playwright Chromium and inspected its actual screenshots. |
| IPFS URL | After review: network publishing uses the supplied relative-URL `dist/`; no URL or CID invented |

## Scope and assumptions

This is a new, single-page React/TypeScript game. The supplied Better Interface workflow and all six core domains, design-critic criteria/probe, and wallet connector references were read before implementation. The chosen visual idea is a gray mouse with a yellow scarf on a sunlit pantry shelf. No existing brand system or assets were supplied.

Local gameplay is primary and needs no wallet. The leaderboard starts empty and shows only actual runs saved in the visitor's browser. The top five are displayed and ten are retained. Wallet attribution is captured at run start. “Sepolia” is an explicitly unavailable future on-chain view. A real contract or verified-score service is outside this version, and no owner address/key/contract was needed or guessed.

All browser interaction checks used the **production export** under `/preview/`. External requests were blocked, so gameplay, art, fonts, and static UI were checked without a CDN or RPC. Simulated providers exercise connection behavior; those fixtures are confined to the validation script/context and are not shipped as game data.

## Requirement coverage

| Brief requirement | Status / implementation evidence |
| --- | --- |
| “new project named Squeek Runner” | Met: package, browser title, brand, game and metadata |
| “cute mouse…runs, jumps…randomly generated obstacles…collects cheese” | Met: original canvas artwork and independent `RunnerEngine`; real collision/collection observed in Chromium |
| “smooth animations” | Met: requestAnimationFrame rendering, fixed 120Hz physics, animated stride/jump, high-DPI canvas; no idle autoplay |
| “keyboard controls (Space/Up), mobile touch controls” | Met: both keys tested; scene tap and separate Jump button tested |
| “score, local best score, increasing difficulty” | Met: score/cheese UI, persisted local best, increasing speed; nine seeded two-minute simulations across three widths remain jumpable |
| “start, pause, restart, game-over screen and sound controls” | Met: exercised every game state, frozen pause counters, restart/reset, sound setting and persistence; audible quality not manually checked |
| “modern minimalist…responsive desktop and mobile” | Met: actual 320/390/740/1440 reflow, desktop and phone screenshots, no horizontal overflow |
| “MetaMask and Rabby…Sepolia…11155111” | Met in implementation: EIP-6963, individual branded providers, chain detection, switch/add fallback; browser behavior tested with simulated providers |
| “leaderboard…addresses and scores…distinguishing demo/local…blockchain” | Met: local guest and connected-address rows, full-address view, explicit local-only labels, no seeded demo entries; unavailable Sepolia view explains the absence of blockchain data |
| “Do not fabricate on-chain transactions or claim…complete” | Met: no contract, signing, transaction, prize, or shared-database claim; null deployment; simulated provider log contains no send/sign requests |
| “website hosted on IPFS” | After review: complete export supplied for the network's pinning process, with relative assets tested at a gateway-style subpath |
| “easy to extend…future…contract…on-chain leaderboard” | Met: engine/results/storage/connection separation and `artifacts/SEPOLIA.md` integration boundary and verification requirements |
| “dist/index.html and its assets…source and lockfile” | Met: complete export is Git-visible and not ignored; source and lockfile supplied; no dependency/cache directories or tarballs in submission |
| “production build, typecheck and useful interaction validation…actual results and limitations” | Met: commands/results below plus JSON records and explicit unperformed checks |
| “pinned Better Interface…six domains…fixes…coverage…limitations” | Met: coverage and corrected findings below; factual root `DESIGN.md` |
| “first screen at 390…product and…main action…title, favicon, description, og:title and og:image” | Met: inspected first screen and actual 1200 × 630 PNG; metadata/resource checks pass |
| “DESIGN.md…tokens, typography, components and responsive behavior” | Met: final-source documentation at repository root |
| “README…install, preview and rebuild” | Met: install/dev/build/preview/test/static-hosting instructions |

There are no known missing or faked implementation requirements. Publishing is an after-review step. Unperformed device/browser/real-wallet checks are limitations, not claimed passes.

## Six-domain review

| Domain | Checked coverage | Explicit limits / not applicable |
| --- | --- | --- |
| Accessibility | Native buttons/links/dialog/table, names, one H1/main, skip link, keyboard game control, Tab/Shift+Tab cycling, Escape close, focus return, visible focus screenshot, 44px phone targets, polite run announcements, axe on key states | No screen-reader session, physical assistive technology, native 200% browser zoom, or full forced-colors session. The runner is a visual timing game; equivalent nonvisual gameplay is not established. No forms to audit. |
| Layout | First-screen task priority, shared edges, gutters, grouping, desktop/touch controls, supporting grid collapse, bottom sheet, table alignment, long full address, 320/390/740/1440 overflow checks, 200% text enlargement | Complete RTL/pseudo-localization and every possible viewport not performed; English-only interface. Text enlargement is not native browser zoom. |
| Writing | Action labels, immediate control instructions, consistent run/score terminology, local-only source labels, unavailable-chain explanation, rejection/retry notes, blocked-storage recovery, empty-state action | No invented global ranks, transactions, deployment, prizes, or verified-score claims. |
| Typography | Local font loaded in browser, six active sizes, three weights, tabular scores, restrained tracking, balanced headings, address wrapping/full disclosure, readable supporting text | No italic/localized font variant required; no exhaustive font-rendering test on other operating systems. |
| Colors | Semantic tokens, plain-surface taste contrast, actual ready-canvas pixel sampling at four widths, secondary scene text correction, status text/icons alongside color | No dark theme. Canvas measurements cover ready state, not every animated frame. Axe on paused/over/connected dialogs cannot replace a complete pixel audit of every possible state. |
| UI | Flat scene/support system, consistent SVG set, preserved wallet marks, primary/secondary/text controls, hover/focus/pressed/disabled/pending states in source, rendered game/menu/modal states, reduced-motion checks, native modal behavior | No 10%-speed animation-panel replay; transitions were reviewed in source and reduced-motion behavior exercised. Real wallet app/popup/passkey flows unperformed. |

## Findings, fixes, and rechecks

All paths below point to final source, where the correction is visible. No high/medium finding remains open.

### HIGH · Optional wallet storage blocked the whole game

**Source:** `src/wallet/config.ts:15` (`walletStorage`) and `src/wallet/config.ts:42` (`storage: createStorage(...)`).

**Observed:** A browser-context fixture made the localStorage getter throw `SecurityError`. The wallet library's default storage path prevented the initial game from rendering; the browser reported “Storage blocked.”

**Change:** Provide a guarded wagmi storage adapter with an in-memory fallback, separately from game score persistence. The game continues with session scores and explains that saving is unavailable.

**Why / recheck:** Optional wallet infrastructure must not block local play. The final blocked-storage production check starts, finishes, records a session score, shows the limitation, and restarts successfully; zero browser errors.

### MEDIUM · Dialog focus could leave the sheet

**Source:** `src/components/Modal.tsx:38`, `onKeyDown` boundary handling.

**Observed:** After tabbing past the last control in the native dialog, browser focus left its contents. The interaction check failed its focus containment assertion.

**Change:** Keep native `showModal()` and its inert background, add Tab/Shift+Tab cycling between the first/last enabled visible controls, and preserve trigger focus return on close.

**Why / recheck:** A keyboard-only player must be able to use and leave help/connection sheets predictably. Eight sequential Tabs remain inside help; Escape closes it and returns focus to How to play. Ready/help/wallet axe checks pass.

### MEDIUM · Supporting copy over artwork missed contrast

**Source:** `src/styles.css:32`, `--color-scene-text`, consumed at `src/styles.css:363` and `src/styles.css:470`.

**Observed:** The pinned probe correctly excluded text over canvas from its solid-background contrast check. The additional actual-pixel audit found the menu description at 4.39:1 at 390px and 3.65:1 at 740/1440px; floor captions reached 4.14:1 at 1440px.

**Change:** Introduce the darker scene-text role `#505447` and apply it consistently to supporting menu, HUD and caption text, keeping plain-page secondary copy unchanged.

**Why / recheck:** Small text needs 4.5:1 against the actual artwork. The final ready-state audit passes all 38 cases, with minimum 4.82:1; the phone minimum is 5.80:1. JSON contains foreground, worst sampled background, ratio, and threshold per case.

### LOW · Phone utility targets were below the comfortable size

**Source:** `src/styles.css:191` and `src/styles.css:1117`.

**Observed:** The probe accepted every control under its 24px/spacing requirement but reported three below the 44px comfort size: the brand link and compact sound/pause widths.

**Change:** Give the brand a 44px minimum height and retain 44 × 44px sound/pause targets at narrow widths.

**Why / recheck:** These controls have room for a comfortable touch area. The final probe reports **zero controls below 44px at 390**, with no overflow at 320/390/1440. Primary actions and phone wallet rows are at least 48px high.

### LOW · A changing sound action name also exposed toggle semantics

**Source:** `src/components/Game.tsx:246`.

**Observed:** The speaker action used a changing “Turn sound on/off” accessible name together with `aria-pressed`, which made its meaning unnecessarily ambiguous.

**Change:** Retain the explicit next-action name, icon, and current-state title; remove redundant toggle semantics. Audio context creation/resumption is limited to a user gesture.

**Recheck:** Both named actions and persistence pass in the final production run. Ready and game-over axe checks pass. Audible quality remains unverified.

### Probe candidate · Canvas fallback text was counted as visible overlap

**Source:** `src/components/Game.tsx:208` and `index.html` noscript help.

**Observed:** The initial probe counted the canvas's own fallback text as a full-scene text box and reported 19 overlaps, even though that fallback text was not painted by a canvas-capable browser. Screenshot review confirmed this was not a visible text collision.

**Change:** Keep the canvas's descriptive accessible name and adjacent control instructions, remove the redundant canvas child text, and supply a real noscript explanation in HTML.

**Recheck:** Final taste layout passes: no horizontal scroll, text overlap, floating-control obstruction, or clipped text. This candidate is not counted as a reproduced visual defect.

### HIGH · Existing ignore rules omitted the evidence directory

**Source:** `.gitignore:14` and required-path assertions in `scripts/bundle-budget.mjs`.

**Observed:** The first Git-visible byte audit counted source and export but omitted `artifacts/`, including the validation report and extension guide. A Git ignore check confirmed those files were excluded by existing repository defaults.

**Change:** Explicitly include `/artifacts/` and its contents in the allowed 1,024-byte `.gitignore` budget. Make the bundle check require the documentation and key evidence paths as well as the export and lockfile.

**Why / recheck:** Required delivery documentation must survive submission. Final Git status includes all 65 intended files, including screenshots, licenses, and JSON records. The complete bundle remains approximately 1.40 MiB and passes the 8 MiB check. The ignore file is 269 bytes; no dependency/cache directory is included.

## Commands actually run

```sh
npm run typecheck
npm test
npm run build
npm run test:browser
node scripts/visual-audit.mjs
npm run check:bundle
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The worker supplied Playwright's standard browser-cache setting when invoking browser commands. The pinned probe also received the installed Playwright module via `IMD_PLAYWRIGHT`. These are validation runtime settings; no private runtime configuration is embedded in the export.

Initial development failures were corrected: a wrong Fontsource subset import was replaced with the actual local WOFF2; an engine status narrowing type error was corrected; the test launcher uses Node's tsx import hook rather than a CLI IPC socket unsupported by this sandbox. Final build/typecheck/tests exit successfully. The production build retains one nonfatal unused-Tempo-path `node:worker_threads` externalization warning; the configured connectors are injected and Coinbase, and no production resource or console errors occur in tested paths.

## Evidence

- `browser-validation.json`: all 14 final Chromium check results, no console/page errors or missing local resources, explicit unavailable WebKit coverage, timestamps.
- `design-probe.json`: the pinned probe's 16 actual final checks, including its canvas-contrast limitation and zero undersized comfortable targets.
- `contrast-validation.json`: actual pixel/foreground pairs for the 38 ready-state measurements at 320/390/740/1440px.
- `export-manifest.json`: final static export file sizes and SHA-256 hashes.
- `screenshots/mobile-ready.png`: actual 390px production page; first-screen Start running and pantry scene inspected.
- `screenshots/desktop-ready.png`: actual desktop scene and supporting layout.
- `screenshots/mobile-game-over.png`: actual run result, new local best, collected cheese, and local leaderboard row.
- `screenshots/mobile-wallet.png`: actual 390px branded open-in sheet and paused game behind it.
- `screenshots/desktop-focus.png`: visible keyboard ring on the header action.
- `screenshots/wallet-connected.png`: connected-account sheet from a **simulated provider**, not a real account or blockchain transaction.

These screenshots were generated by the bounded production test server and visually inspected by the worker. The pinned probe's own captures remain in `test/scratch/taste/shots/`, which is intentionally removed before submission; it is not a runtime dependency.

## Limitations and completion

**Complete for the requested local-game and wallet-interface scope, with the coverage limits above.** Source, lockfile, production export, design documentation, setup instructions, extension guidance, and actual validation artifacts are supplied.

WebKit binaries were present but could not launch because required host libraries were absent (including `liblcms2.so.2`); no Safari/iOS pass is claimed. The managed browser launcher could not start its configured Chrome, so actual rendered inspection used standalone Playwright Chromium. No real MetaMask/Rabby approval, Coinbase passkey creation, physical phone handoff, physical device, screen-reader session, native 200% zoom, full forced-colors/RTL session, or subjective audio-quality check was performed.

There is no contract, blockchain leaderboard, score proof, or shared backend to certify. Real wallet/provider services may be unavailable independently of this export. IPFS pinning and naming occur after handoff; the worker does not claim a live deployment URL. No requester input is required to use this version.
