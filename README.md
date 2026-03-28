# Dyne.org Tech Radar

This repository now builds a multi-radar static Vite site backed by YAML content.

## Repository Structure

- `data/home.yml`: homepage copy, section labels, and ring descriptions
- `data/radars/<radar-key>.yml`: radar-wide metadata, label, rings, and quadrants with inline entries
- `src/radar/renderRadar.js`: D3 renderer adapted from the original static implementation
- `src/radar/normalizeRadarData.mjs`: transforms symbolic YAML content into the renderer format
- `scripts/generate-radar-data-module.mjs`: build-time data generation from YAML
- `docs/`: legacy static implementation kept as reference during the migration

## Local Development

Install dependencies:

```sh
npm install
```

Start the Vite dev server:

```sh
npm run dev
```

While the dev server is running:

- changes in `src/` hot reload immediately
- changes in `data/**/*.yml` regenerate the derived module and trigger a full page reload

Build the static site:

```sh
npm run build
```

Run tests:

```sh
npm test
```

Run lint checks:

```sh
npm run lint
```

## Content Workflow

The source of truth for radar content is YAML.

- Edit `data/radars/<radar-key>.yml` for per-radar metadata, label, quadrants, and entries.
- Edit `data/home.yml` for homepage copy.
- `npm run sync:data` regenerates the JS module consumed by the app.
- `npm run dev` and `npm run build` run the data sync automatically.

## Notes

- The chart renderer is still based on the original Zalando/Thoughtworks-style D3 radar.
- The current Vite app is intentionally simple so it can later be embedded into VitePress without rewriting the data or rendering layers.

## License

MIT
