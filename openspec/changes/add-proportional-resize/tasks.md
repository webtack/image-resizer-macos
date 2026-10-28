# Tasks

## 1. Preset model and validation

- [x] 1.1 Make `width`/`height` of `SizePreset` and `PresetInput` `number | null` in `src/shared/types.ts`; update TSDoc and verify `npm run build` compiles once dependent code is adjusted in this group
- [x] 1.2 Update `validatePreset` in `src/core/presets.ts`: accept `null` for one side, reject both `null` with `Enter a width, a height, or both`, keep the 1–16384 integer rule for filled sides; verify with new cases in `src/core/presets.test.ts` (width only, height only, both empty, invalid filled side)
- [x] 1.3 Update `PresetStore.parse`/`clean`/`add`/`update` to persist and load `null` sides, and keep old files (both numbers) valid; verify with `presets.test.ts` cases for a round-trip of a one-sided preset and loading a legacy file
- [x] 1.4 Document one-sided presets, the new validation message, `null` storage and the downgrade note in `docs/presets.md`; verify the documented messages match the code strings

## 2. Proportional geometry and processing

- [x] 2.1 Add `resolveCanvas` (with TSDoc and `@example`) to `src/core/fit.ts`; verify with `src/core/fit.test.ts`: 4000×3000 + width 1080 → 1080×810, 3000×4000 + height 1350 → 1013×1350, 3000×4000 + width 1000 → 1000×1333, small source scaled up, clamp to 16384 for 20000×100 + height 1000, both sides returned unchanged
- [x] 2.2 Change `BatchOptions`/`processFile` in `src/core/batch.ts` to take `target` and resolve the canvas per image before `smartFit` and `writeOutput`; verify with `src/core/batch.test.ts`: a width-only run over a landscape and a portrait image produces `a_1000x750.*` and `b_1000x1333.*`, and a two-sided run is unchanged
- [x] 2.3 Verify in `src/core/smart-fit.test.ts` that a one-sided result has the computed size, no margins and a transparent PNG becomes white, not black, in a JPEG
- [x] 2.4 Update `isPreviousOutput` and `DiscoveryOptions` in `src/core/discovery.ts` for one-sided presets; verify with `src/core/discovery.test.ts`: `photo_1000x750.jpg` excluded for width 1000, `photo_1013x1350-1.jpg` excluded for height 1350, `photo_800x600.jpg` kept for width 1000
- [x] 2.5 Update `docs/smart-fit.md` (proportional path, rounding, clamping, examples) and `docs/batch.md` (names with real size, exclusion pattern); verify the example sizes match the unit tests

## 3. App wiring and UI

- [x] 3.1 Pass `target: { width: preset.width, height: preset.height }` in `src/main/ipc.ts` and adapt `discoverImages` calls; verify `npm run build` succeeds
- [ ] 3.2 Update `src/renderer/renderer.ts` and `index.html`: empty field parses to `null`, `1080×auto` / `auto×1350` labels in the selector and manage list, the "Leave one side empty to scale proportionally." hint, editing a one-sided preset fills only its set field; verify by running `npm start` and creating, editing, selecting and deleting a width-only and a height-only preset
- [x] 3.3 Update `docs/usage.md` and `docs/presets.md` with the UI steps and labels; verify each documented control name exists in `index.html`

## 4. Integration check

- [x] 4.1 Run `npm test` and confirm all suites pass
- [ ] 4.2 Run the app on a folder with a landscape and a portrait photo using a width-only preset and then a height-only preset; verify output sizes and names match `docs/batch.md` and that a repeated run does not re-process its own results
