# Squeek Runner design system

## Overview

Squeek Runner is a small endless runner for a short desktop or phone break. Its visual idea is a gray mouse with a yellow scarf crossing a sunlit pantry shelf. Warm neutrals, charcoal type, and a single cheese-yellow action make the game feel quiet and approachable.

The game comes before explanation. The page uses a compact brand/utility header, a short headline, one large game scene, a control rail, and supporting instructions plus the local leaderboard. There is no marketing-only screen before play. The 390px production screenshot shows the product and Start running together on the first screen.

Canonical UI tokens and shared classes live in `src/styles.css`. Canvas illustration colors and geometry live in `src/game/draw.ts`; these are artwork, not a second UI theme. This version intentionally has one light theme.

## Colors

CSS uses hexadecimal primitives with semantic aliases. Reuse semantic tokens in components. The neutral primitives are `--stone-50`, `100`, `150`, `200`, `600`, `700`, `800`, and `900`; the four yellow values and one green value have the specific roles below.

| Semantic token | Implemented value | Use |
| --- | --- | --- |
| `--color-bg` | `#faf9f6` | Page background |
| `--color-surface` | `#fffefb` | Modal surface |
| `--color-scene` | `#f4f0e5` | Pantry scene base |
| `--color-subtle` | `#eeebe3` | Quiet selected/hover surfaces and secondary controls |
| `--color-border` | `#e1ddd2` | Scene outline, dividers, table rows |
| `--color-text` | `#353c32` | Body and interface text |
| `--color-text-strong` | `#2d342b` | Headings and primary action text |
| `--color-text-secondary` | `#62665a` | Supporting copy on plain surfaces |
| `--color-scene-text` | `#505447` | Supporting text over canvas artwork |
| `--color-accent` | `#f3cc59` | Main action fill and headline underline |
| `--color-accent-hover` | `#ebbe40` | Primary action hover |
| `--color-highlight` | `#fbefc5` | Cheese illustration accent and text selection |
| `--color-cheese-ink` | `#806323` | Cheese art, new-best message, storage/network caution text |
| `--color-success` | `#4d6848` | Connected/network status, always accompanied by text/icon |
| `--color-focus` | `#466444` | 3px keyboard focus outline with 3px offset |

The darker scene text is deliberate: artwork can be darker than the plain page. The final pixel audit samples the actual canvas behind ready-state labels, descriptions, controls, and captions. It measured 38 passing cases across 320/390/740/1440px; the lowest ratio was **4.82:1**. The narrow layouts' minimum was 5.80:1 or better. Full records and the sampling limits are in `artifacts/contrast-validation.json`. Do not infer every animated frame or every overlay state from that ready-state measurement.

Status never relies on color alone: connection has an address/state label, network mismatch has text, new-best has a trophy and text, and selected tabs have a bottom rule plus `aria-selected`.

## Typography

`DM Sans Variable` is self-hosted as the Latin normal variable WOFF2 from `@fontsource-variable/dm-sans`. Its `@font-face` declares weights 100–900 and `font-display: swap`; the interface uses **400, 600, and 700**. The fallback stack is `'DM Sans', sans-serif`. No italic face is used. The browser interaction check confirms that the intended local face reaches loaded status.

| Token | Size | Role |
| --- | --- | --- |
| `--text-caption` | 13px / 0.8125rem | HUD labels, captions, keyboard keys, metadata |
| `--text-small` | 14px / 0.875rem | Supporting copy, tabs, wallet header action |
| `--text-body` | 16px / 1rem | Primary actions, row labels, subsection headings |
| `--text-heading` | 20px / 1.25rem | Brand, section/modal headings |
| `--text-feature` | 28px / 1.75rem | Game menu heading, score numbers, run summary |
| `--text-display` | 48px / 3rem; 32px / 2rem at ≤46rem | Main headline |

The type scale has six active sizes per width. H1 uses 700, line-height 1.15 (1.12 on phones), and tracking −0.055em (−0.045em on phones). H2 uses 700/1.3/−0.025em; the game menu uses 600/1.2/−0.035em. Body line-height is 1.5, with 1.6 on longer supporting text. Headings balance; paragraphs use pretty wrapping.

Changing scores use tabular numbers. Addresses use 14px system monospace in full-address views and wrap anywhere; shortened wallet labels expose a full selectable address through a modal. No body prose uses monospace. The root applies font smoothing once. Normal sentence case and untracked labels are the default.

## Layout

Spacing tokens follow a 4px basis: `--space-1/2/3/4/5/6/8/10/12` are **4/8/12/16/20/24/32/40/48px**. Components also use optical adjustments and multiples such as the 96px desktop column gap. Group spacing is larger than spacing within a group.

`.page-shell` caps content at **1184px**, initially with 40px minimum side gutters. The desktop header is 96px high. The introduction is a heading/description row. The game frame is 420px high; its canvas scales a 400-unit-high world to the displayed box, with a device-pixel ratio cap of 2. UI text and buttons remain real DOM elements above the canvas.

`.below-game` uses a 0.9fr / 1.1fr grid with a 96px gap, instructions on the left and the board on the right. The board uses a real table, not separately positioned columns. Its empty state offers a text action that starts the same game.

| Breakpoint | Implemented response |
| --- | --- |
| ≤65rem / 1040px | 24px gutters, 48px supporting-column gap, 400px scene, shorter footer |
| ≤46rem / 736px | 16px gutters, stacked intro, 32px headline, 76px header, 360px scene, one supporting column; board appears before tips |
| <40rem / 640px | Dialog becomes a bottom sheet with safe-area bottom padding |
| ≤23rem / 368px | Header shortens Connect wallet to Connect and wraps when the brand and wallet cannot fit; wallet aligns to the trailing edge with `margin-inline-start: auto`. HUD spacing and menu type become more compact |
| Coarse pointer | Tap instruction replaces keyboard hints; an additional 48px Jump control appears while running |

The HUD maintains 44px sound/pause targets at narrow widths. The brand link also has a 44px minimum height. Content wraps without horizontal scrolling in the checked 320/390/740/1440px layouts. The main game action is visible at 390 × 844. The text-enlargement check uses a 200% root text size at desktop width; native zoom and a complete RTL mirror were not performed.

## Elevation & depth

The page is deliberately flat. Space and shared alignment group content; hairlines separate the control/support area and table rows. The game frame has a single border and no shadow. There are no nested cards.

Only `.modal` uses elevation: `0 20px 70px #20271b33`, with no border, above the native dialog backdrop `#30372c70`. Native modal behavior makes the background inert. The paused and finished scenes fade canvas opacity to 0.3 so the DOM menu stays dominant. The headline's yellow underline is the one decorative type treatment; it is not an interactive affordance.

## Shapes

`--radius-control: 10px` is used for primary/secondary actions, wallet controls, icon hover surfaces, and wallet rows. `--radius-scene: 20px` defines the desktop game and centered modal. The phone game uses 16px; phone sheets use 24px top corners and square bottom corners. Keyboard keys use 4px, local-data labels 5px, and rule illustrations circles.

The scene clips artwork intentionally; labels and controls are inset inside that boundary. Full addresses wrap rather than being clipped. Mouse and cheese marks use rounded lines and simple silhouettes; interface icons use one original 24-unit SVG set, `currentColor`, and a 1.7px base stroke. Official wallet marks retain their own colors.

## Components

| Component / pattern | Source | Reuse and behavior |
| --- | --- | --- |
| Primary / secondary / text action | `.button`, `.primary`, `.secondary`, `.text-button` in `src/styles.css` | 48px primary controls; one filled action per active view. Hover, active, focus and disabled states. No generic click container. |
| Icon / brand mark | `src/components/Icon.tsx` | `Icon` takes `name`, `size`, optional class/style; decorative SVGs are hidden from assistive technology. Icon-only actions provide their own accessible name. `MouseMark` identifies the brand. |
| Game | `src/components/Game.tsx` | `best`, `sound`, `address`, callbacks, and a `GameHandle` with `start`/`pause`. Ready/running/paused/over states, DOM HUD, keyboard/touch input, persistent end-of-run announcement. |
| Wallet control | `src/wallet/ConnectWallet.tsx` | One header entry point; discovered providers, mobile open-in rows, SDK connection, pending/rejection/retry, wrong-network switching, full address/copy, disconnect. Opening pauses gameplay. |
| Leaderboard | `src/components/Leaderboard.tsx` | `runs`, `onStart`, and `onOpen`; local empty/populated table, separate unavailable Sepolia view, keyboard-operated tabs, full-address disclosure. `onOpen` pauses an active run before showing a player address; closing leaves resume explicit. No invented blockchain entries. |
| Modal | `src/components/Modal.tsx` | `title`, `children`, `onClose`, optional `className`. Native `showModal`, close button, Escape/backdrop close, Tab/Shift+Tab boundary cycling, and return to the opening control. Scrolls within viewport limits. |
| Keyboard/help pattern | `Game`, `App`, `.control-rail`, `.help-keys` | Directions next to the play surface; detailed rules open a modal. Keyboard focus enters the canvas for Space/Up play without scrolling the page. |
| Storage limitation | `src/App.tsx`, `.storage-warning` | Persistent plain explanation near the game when saving fails; gameplay and session scores continue. |

Scores do not create continuous live-region chatter. Starting, pausing, resuming, and finishing update a stable polite status region. Sound is an action with a state-specific accessible name. Pointer activation of HUD sound/pause returns focus to the canvas without scrolling, keeping jump shortcuts available. Keyboard activation retains native button behavior; P/Escape also work while a HUD button has focus. Game shortcuts leave dialogs and editable fields alone. Dialog focus and keyboard focus are visible in the recorded browser screenshots.

Interactive transitions name only their properties and last **150ms** with `cubic-bezier(0.2, 0, 0, 1)`. Press scale is **0.96**. They run only with no reduced-motion preference. The game itself starts only on request, pauses on blur/hidden documents, and freezes all simulation counters while paused. Reduced motion removes nonessential canvas parallax, floating cheese, collection particles, and button transforms; essential obstacles and jumping continue. There is no idle animation or autoplay soundtrack.

## Do's and don'ts

- Start from `.page-shell`, existing heading roles, and the semantic token aliases when extending the page. Keep primary play above explanations on phones.
- Give a new primary action the existing yellow fill; keep its peers neutral. Preserve full keyboard and touch paths.
- Use `--color-scene-text` for copy over the pantry, and measure new artwork/text combinations against actual pixels.
- Keep local/browser records distinct from verified blockchain records. Use existing empty/error states instead of seeded players or transaction-looking decoration.
- Reuse `Modal` and the SVG icon set. Keep new address/ID values selectable and recoverable in full.
- A future additional page should reuse the header, `.page-shell`, type/color tokens and flat section pattern, and use hash navigation unless it is explicitly exported as a static route. This version contains one page.
- Do not add extra fonts, tracked-capital kickers, simultaneous moving decorations, artificial global ranks, or a dark theme without an actual product requirement.

The consolidated six-domain review, actual findings/fixes, screenshots, and unperformed checks are recorded in `artifacts/validation.md`. This document describes the final implementation, not an independent accessibility certification.
