# Image Resizer

Desktop app (macOS) that batch-resizes a folder of photos to a fixed canvas: the whole photo is kept
and empty margins are filled with a blurred copy of the same photo.

Full documentation lives in [`docs/`](docs/README.md).

## Commands

```bash
npm install     # install dependencies
npm start       # build and run the app
npm test        # run unit tests (Vitest)
npm run build   # compile TypeScript to dist/
npm run dist    # build unsigned .dmg and .zip into release/
```

## About

This app was built with [Claude Code](https://claude.com/claude-code) using the
[OpenSpec](https://github.com/Fission-AI/OpenSpec) spec-driven workflow (see [`openspec/`](openspec/)).
