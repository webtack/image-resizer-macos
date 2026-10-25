# Image Resizer — documentation

## Purpose

Image Resizer is a macOS desktop app that batch-resizes photos to a given canvas (for example,
1080×1350 for social networks). Each photo is scaled by its longer side without cropping, and the
empty margins are filled with a blurred copy of the same photo. Originals are never modified: results
are saved to a `resized` subfolder next to them as `<name>_<W>x<H>.<ext>`.

The app works fully offline and collects no data.

## Documentation structure

| File | Contents |
| --- | --- |
| [README.md](README.md) | This file: purpose, installation, running and tests |
| [smart-fit.md](smart-fit.md) | Fitting algorithm and blurred background |
| [batch.md](batch.md) | Image discovery, naming, formats, errors and cancellation |
| [presets.md](presets.md) | Size presets: creating, editing, storage |
| [usage.md](usage.md) | Step-by-step user guide |
| [release.md](release.md) | Building `.dmg`/`.zip`, Gatekeeper, distribution |

## Development setup

Requires macOS 13+ and Node.js 20.

```bash
npm install
```

## Running

```bash
npm start
```

The command builds the TypeScript (`npm run build`) and opens the app window.

## Tests

```bash
npm test
```

Unit tests (Vitest) cover `src/core` — the logic that does not depend on Electron.

## Building for distribution

```bash
npm run dist
```

Details are in [release.md](release.md).
