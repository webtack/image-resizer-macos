# Design

## Context

Greenfield desktop app (see proposal.md). Requirements live in `specs/batch-resize`, `specs/smart-fit`, `specs/size-presets`. Constraints: simple, macOS 13+, no Xcode, no App Store, no network.

## Goals / Non-Goals

**Goals:**
- Image pipeline isolated from UI so it is unit-testable and reusable (e.g. a future CLI).
- Fast batch: bounded parallelism, no full-resolution images held longer than needed.
- Predictable output (exact canvas size, upright, no transparency in JPEG).

**Non-Goals:**
- Cropping/fill modes other than smart fit, watermarking, renaming templates, metadata editing, Photoshop-style actions, Mac App Store distribution, code signing/notarization, auto-update, in-app purchases.

## Decisions

**Electron + TypeScript, core separated from the shell.** `src/core` holds pure Node modules (discovery, fit geometry, renderer, encoder, naming, batch runner, preset store) with no Electron imports and is tested with Vitest. `src/main` (window, dialogs, IPC), `src/preload` (`contextBridge`, `contextIsolation` on, `nodeIntegration` off) and `src/renderer` (plain TypeScript + HTML/CSS, no UI framework) form the shell. *Alternative:* Swift/SwiftUI — needs full Xcode, unavailable on the target machine. *Alternative:* Tauri — needs a working Rust/Apple toolchain.

**Rendering with `sharp`.** Per file: `sharp(input).rotate()` applies EXIF orientation; the background is the image resized to cover W×H (`fit: 'cover'`), downscaled to ≤ 1/4 canvas, blurred with sigma ≈ 4% of the larger canvas side (scaled to the downscaled size) and upscaled back; the sharp layer is the image resized to fit (`fit: 'inside'`, Lanczos3) and composited centred. Output is converted to sRGB and flattened (alpha composited over the blurred background, never black). *Alternative:* node-canvas / Canvas in the renderer — slower and heavier.

**Skip blur when no margins.** If the fitted size equals the canvas within 1px, resize directly without a background.

**HEIC via `sips`.** Prebuilt `sharp` has no HEIC decoder. HEIC/HEIF inputs are converted with `/usr/bin/sips -s format jpeg` into a per-run temp directory, then processed like any JPEG; the temp file is removed afterwards.

**Output encoding.** JPEG with quality 1–100, PNG lossless; "Keep original" maps JPEG/PNG/WebP/TIFF to the same format and falls back to JPEG for anything else (e.g. HEIC).

**Naming and collisions.** `<stem>_<W>x<H>[-n].<ext>`; collision check before write; write to a temp file in the same folder and `rename` into place, so cancel/crash never leaves partial files. Discovery excludes files whose stem ends with `_<W>x<H>` of the selected preset.

**Concurrency.** Async batch runner with a worker limit of `max(2, floor(cpus / 2))`, cooperative cancellation checked between files, results streamed to the renderer over IPC events. `sharp.concurrency` is capped to avoid oversubscription.

**Presets storage.** JSON file `presets.json` in `app.getPath('userData')` holding presets and the selected preset id. The core receives the directory as a parameter, so tests use a temp dir.

**UI.** Single window, Image Processor-like top-to-bottom flow: 1) folder picker + drop target, count + file list; 2) preset picker with "Manage presets…" dialog; 3) output format/quality + "include subfolders"; 4) Run/Cancel with progress and result list. Folder via `dialog.showOpenDialog`; drop via the `drop` event with `webUtils.getPathForFile`.

**No network.** No HTTP calls in code; renderer CSP is `default-src 'self'`; no auto-updater, telemetry or remote content.

**Packaging.** electron-builder produces `.dmg` and `.zip` for arm64 and x64, unsigned (`identity: null`). `sharp` native binaries are listed in `asarUnpack`. Users open the first launch with right-click → Open.

**Write failures.** Permission errors (`EACCES`, `EPERM`, `EROFS`) from the atomic write are mapped to a per-file "cannot write to folder" failure instead of aborting the batch.

**Tuned blur value (task 3.4).** Visual check on landscape (4000×3000→1080×1350), portrait (3000×4000→1920×1080), panorama (6000×1000→1080×1080) and small (400×300→1080×1350) fixtures: `BLUR_SIGMA_RATIO = 0.04` (sigma = 4% of the larger canvas side, applied on a 1/4-scale layer with mirrored edges) reads as ambient colour, shows no banding, and gives no dark edges, so it is kept unchanged.

## Risks / Trade-offs

- [Blur looks banded or has dark edges] → blur a downscaled cover layer with a large radius and extend edges; verify visually with fixture images.
- [Memory spikes on large batches of 50MP photos] → `sharp` streaming pipelines, limited concurrency, `limitInputPixels` kept at the default guard.
- [Colour shifts] → convert to sRGB on output; documented trade-off (wide-gamut sources lose gamut).
- [Unsigned app is blocked by Gatekeeper] → document right-click → Open (or `xattr -cr`) in `docs/release.md` and `docs/usage.md`.
- [`sharp` native binary missing in the packaged app] → `asarUnpack` plus a smoke test that runs the packaged `.app` on a fixture.
- [`sips` fails on a damaged HEIC] → per-file failure with reason; batch continues.
- [Upscaling small photos looks soft] → accepted per spec; high-quality interpolation only.
