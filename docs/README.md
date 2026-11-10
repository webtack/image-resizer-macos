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
| [images/](images/) | Screenshot and sample photos used in the README and docs |

## Sample photo credits

`images/before.jpg` and `images/after.jpg` are made from the photo
["Lake Mountain Landscape"](https://commons.wikimedia.org/wiki/File:Lake_Mountain_Landscape.jpg) by
Bonnie Moreland (original source: [ISO Republic](https://isorepublic.com/photo/lake-mountain-landscape/)).
The photo is released under the
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) public-domain dedication, so
attribution is not required; it is given as a courtesy. `before.jpg` is the original downscaled to
1200 px on the longer side with all metadata removed; `after.jpg` is the real output of the app
(preset **Portrait 4:5 (1080×1350)**, JPEG quality 90). `images/before-portrait.jpg` and
`images/after-landscape.jpg` are made from the photo
["Karekare Falls with a tree branch"](https://commons.wikimedia.org/wiki/File:Karekare_Falls_with_a_tree_branch.jpg)
by Nolabob (own work, CC0 1.0 Universal, same dedication as above). `before-portrait.jpg` is downscaled
with metadata removed; `after-landscape.jpg` is the real app output (preset **Full HD 16:9**
(1920×1080), JPEG quality 90) downscaled to 1200 px wide to keep the repository small.
`images/app-window.png` is a screenshot of the
app in its initial state.

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
