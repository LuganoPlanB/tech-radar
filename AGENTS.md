# AGENTS.md

## Overview

This repository is a small static D3-based tech radar site.

- Runtime assets live in `docs/`.
- `docs/index.html` is both the page shell and the primary data source for the radar.
- `docs/radar.js` contains the rendering and layout logic.
- `docs/radar.css` contains the minimal page styling.
- There is no build step or framework layer.

## Working Model

When making changes, assume the safest default is to edit the static files directly and keep the site runnable with a plain local file server or `browser-sync`.

- Treat `docs/index.html` as content plus configuration.
- Treat `docs/radar.js` as the visualization engine.
- Avoid introducing bundlers, transpilers, frameworks, or generated assets unless the user explicitly asks for them.
- Keep changes small and readable; this repo is intentionally simple.

## Local Commands

Install dependencies:

```sh
npm install
```

Start the local dev server:

```sh
npm start
```

Run all lint checks:

```sh
npm run lint
```

Run individual linters:

```sh
npm run lint:js
npm run lint:html
```

## File-Specific Guidance

### `docs/index.html`

Use this file for:

- Radar metadata such as title, dimensions, colors, quadrants, and rings.
- The `entries` array that defines radar items.
- Supporting explanatory copy below the SVG.

When editing entries:

- Preserve the existing object shape: `quadrant`, `ring`, `label`, `active`, `link`, `moved`.
- Keep quadrant indices aligned with the current ordering in the file:
  - `0`: Languages
  - `1`: Infra / Hosting
  - `2`: Network / Security
  - `3`: Data Management
- Keep ring indices aligned with the current inner-to-outer order:
  - `0`: ADOPT
  - `1`: TRIAL
  - `2`: ASSESS
  - `3`: HOLD
- Prefer maintaining the existing section comments and grouping by quadrant.
- Be careful with links: many are relative and some currently point outside `docs/`; do not normalize them unless the task requires it.

### `docs/radar.js`

Use this file for behavior or rendering changes.

- The code is plain browser-side JavaScript targeting D3 v4.
- Preserve compatibility with the existing HTML page and global `radar_visualization` API.
- Do not convert this file to modules or modern build-dependent syntax without an explicit request.
- Keep deterministic layout behavior intact unless the user asks to change placement logic; the seeded random generator is deliberate.
- Existing ESLint rules are permissive, but avoid introducing unnecessary globals or large stylistic rewrites.

### `docs/radar.css`

- Keep styling lightweight and consistent with the static nature of the site.
- Avoid moving large amounts of inline document structure into CSS if it makes the single-page setup harder to follow.

## Linting Constraints

This repo uses:

- `eslint` on `docs/*.js`
- `htmllint` on `docs/*.html`

Important implications from the current config:

- HTML must use lowercase tag names and double-quoted attributes.
- Inline `style` attributes are banned.
- `style` tags are banned.
- Line endings should remain LF.
- JS linting currently disables `no-redeclare`, `no-undef`, and `no-unused-vars`; do not rely on that as a license to add sloppy code.

## Change Strategy

Prefer the following order:

1. Understand whether the request is a content change in `docs/index.html`, a behavior change in `docs/radar.js`, or a presentation tweak in `docs/radar.css`.
2. Make the minimum direct edit.
3. Run the relevant lint command.
4. If behavior changed, sanity-check the page with `npm start` when feasible.

## Things To Avoid

- Do not add a new toolchain for simple content or rendering edits.
- Do not split the radar data into a new format unless the user asks for restructuring.
- Do not “clean up” historical content, labels, or external links as incidental work.
- Do not rewrite the codebase to modern D3 or a framework as part of unrelated tasks.

## Useful Repository Facts

- The project is named `dyne-tech-radar`.
- The local dev server is `browser-sync docs -w`.
- The page currently loads D3 from `https://d3js.org/d3.v4.min.js`.
- The maintainer listed in `MAINTAINERS` is Denis Roio.
