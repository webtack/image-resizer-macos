# Design

## Context

Today a preset is `{ id, name, width, height }` with both sides required (`src/shared/types.ts`, `src/core/presets.ts`). The canvas is fixed per run: `ipc.ts` passes `{ width, height }` from the selected preset to `runBatch`, `processFile` calls `smartFit(image, canvas)`, and the same canvas is used for the output name (`writeOutput`) and for previous-output exclusion (`isPreviousOutput`). A proportional preset breaks the assumption "one canvas per run": the size depends on each image. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Allow a preset with only a width or only a height; derive the other side per image, keeping aspect ratio.
- Keep two-sided presets and existing `presets.json` files working with no change in behavior.
- Keep the pure geometry in `src/core` and unit-testable without Electron.

**Non-Goals:**
- No "fit inside a box" / "max side" mode, no cropping, no percentage scaling.
- No option to disable upscaling for proportional presets.
- No change to output format, quality or folder rules.

## Decisions

**1. Represent an open side as `null`, not as a flag or a mode.**
`SizePreset.width` / `height` become `number | null`. `null` means "calculate". Alternatives: a `mode: 'exact' | 'width' | 'height'` field (redundant — the mode is fully implied by which sides are set, and it could contradict them) or `0` as a sentinel (collides with validation of invalid input). Persisted data from old versions has numbers on both sides, so it parses as before; `parse` additionally accepts `null` for a side as long as the other side is valid. JSON round-trips `null` cleanly, whereas `undefined` would be dropped by `JSON.stringify` and make the intent ambiguous.

**2. One pure function resolves the per-image target size.**
Add `resolveCanvas(source: Size, target: { width: number | null; height: number | null }): { canvas: Size; proportional: boolean }` in `src/core/fit.ts`. Both sides set → returns the target as is (`proportional: false`). One side set → `other = clamp(round(sourceOther × given / sourceGiven), 1, MAX_SIDE)` (`proportional: true`). Both null is rejected by validation and throws here as a defensive check. Alternative: compute inside `smartFit`; rejected because `batch.ts` also needs the resolved size for the output name, and a pure function is easy to test.

**3. Reuse `smartFit` with the resolved canvas.**
After resolution the canvas has the exact aspect ratio of the source (up to rounding), so `calculateFit` already yields `hasMargins === false` and `smartFit` takes its plain-resize branch (`fit: 'fill'`, lanczos3, flatten on white). No second code path is needed for pixels; only `processFile` changes: load image → `resolveCanvas(image.size, preset)` → `smartFit(image, canvas)` → `writeOutput(..., canvas, ...)`. Rounding can leave a 1 px mismatch with the true ratio; the existing "more than 1 px" margin threshold absorbs it, and `fit: 'fill'` stretches by under one pixel, which is invisible. Clamping an extreme ratio to 16384 can produce real margins; in that rare case the blurred-background path runs, which is acceptable and keeps the output valid.

**4. `BatchOptions` takes a target instead of a fixed canvas.**
Replace `canvas: Size` with `target: { width: number | null; height: number | null }` in `BatchOptions` and `processFile`. A two-sided target behaves exactly like the old canvas. `ipc.ts` passes `{ width: preset.width, height: preset.height }`. Alternative: keep `canvas` and add optional fields; rejected as it leaves an impossible state (canvas plus a conflicting target).

**5. Output names use the resolved canvas.**
`writeOutput` already takes the size it names the file with; `processFile` now passes the resolved canvas. No change to `outputName`.

**6. Previous-output exclusion by pattern per preset kind.**
`isPreviousOutput(fileName, target)` builds the regex from the sides that are set: `_<W>x<H>`, `_<W>x\d+` or `_\d+x<H>`, each followed by an optional `-<n>`. A false positive (a source photo named `trip_1000x500.jpg` under a width-1000 preset) is possible; it is the same trade-off the current rule already makes, and results normally live in the skipped `resized` folder anyway.

**7. UI: plain empty fields.**
The preset form keeps two text inputs; empty is accepted. `parseSide` in the renderer returns `null` for an empty string and `NaN`-like invalid values stay invalid so the existing message shows. Validation adds one message for "both empty" under the width field: `Enter a width, a height, or both`. Labels render `1080×auto` / `auto×1350` in the selector and the manage list. The form gets a one-line hint: "Leave one side empty to scale proportionally."

## Risks / Trade-offs

- [Output size now varies per file, so the batch no longer gives uniform dimensions] → This is the purpose of the feature; names carry the real size and docs say so.
- [A huge or tiny source with a one-sided preset can compute a side outside 1–16384] → Clamp in `resolveCanvas`; covered by a unit test.
- [Rounding differs by one pixel from an exact ratio] → Documented; absorbed by the margin threshold.
- [`SizePreset` type change touches several modules] → TypeScript flags every use; renderer and ipc are small edits and are covered by task-level checks.
- [Running a width-only preset repeatedly could re-process earlier outputs placed outside `resized`] → Pattern exclusion from decision 6 plus the existing `resized` folder skip.

## Migration Plan

No data migration: old `presets.json` files are valid as they are, and new files with `null` sides are only produced by the new UI. Rolling back to an older build would drop one-sided presets on load (the old parser filters presets without two valid sides), which loses only those presets; this is acceptable for a local, unsigned app and is noted in `docs/presets.md`.
