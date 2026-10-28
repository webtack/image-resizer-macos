# Proposal

## Why

Every preset today requires both a width and a height, so the user must know the target canvas exactly and pick the aspect ratio up front. A common need is "make every photo 1080 px wide" or "1350 px tall" and let each photo keep its own proportions. Without this, the user has to create a separate preset per aspect ratio or accept margins filled with a blurred background that they did not want.

## What Changes

- A preset may now specify **only a width or only a height** (leaving the other field empty). The missing side is computed per image so that the original proportions are kept: `height = round(sourceHeight × width / sourceWidth)` (and symmetrically for a height-only preset).
- A preset with **both** sides keeps today's behavior unchanged (exact canvas, smart fit with blurred margins).
- A proportional result has no margins, so no blurred background is produced: the photo is simply scaled to the computed size. Small sources are scaled up, as with smart fit.
- Output file names use the **actual** result size, e.g. `IMG_001_1080x810.jpg`, so files from one run can have different `<W>x<H>` parts.
- Preset validation: at least one side is required; a filled side must still be a whole number from 1 to 16384. A computed side is clamped to 1–16384.
- The preset list and selector show an open side as `1080×auto` / `auto×1350`.
- Previous-output exclusion during discovery works for proportional presets (matches `_<W>x<digits>` or `_<digits>x<H>`).
- Existing saved presets keep working with no migration.
- `docs/` is updated (`presets.md`, `smart-fit.md`, `batch.md`, `usage.md`).

Assumption: a "proportional" preset is expressed by leaving a field empty; there is no separate mode switch or checkbox, because an empty field is the shortest way to say "calculate this side".

## Capabilities

### New Capabilities

### Modified Capabilities
- `size-presets`: a preset's width or height may be left empty; validation, display and persistence change accordingly.
- `smart-fit`: adds the proportional resize path (one side given, the other derived, no margins or background).
- `batch-resize`: output names carry the actual computed size; previous-output exclusion covers proportional presets.

## Impact

- Code: `src/shared/types.ts` (`SizePreset`/`PresetInput` sides become optional), `src/core/presets.ts` (validation, parsing of persisted data), `src/core/fit.ts` (new resolution of the target size per image), `src/core/smart-fit.ts`, `src/core/batch.ts`, `src/core/output.ts`, `src/core/discovery.ts`, `src/main/ipc.ts`, `src/renderer/renderer.ts` and `index.html` (form fields, labels, empty-field parsing), plus their tests.
- Docs: `docs/presets.md`, `docs/smart-fit.md`, `docs/batch.md`, `docs/usage.md`.
- No new dependencies. Originals are still never modified. `presets.json` stays backward compatible.
