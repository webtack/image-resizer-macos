# Proposal

## Why

Resizing a folder of photos to a fixed canvas size (for social posts, thumbnails, marketplaces) is a repetitive manual job. Photoshop's Image Processor does it, but it is heavy, paid, and simply scales or crops. A small desktop tool that batch-resizes a folder and fills leftover space with a blurred copy of the photo (the Telegram/YouTube look) removes that friction.

## What Changes

- New desktop app (Electron + TypeScript) for batch-resizing images, modelled on the Photoshop Image Processor flow: pick folder → choose size preset and output format → run.
- Selecting a folder collects all supported images in it; each produces a new file next to its original. Originals are never modified or overwritten.
- "Smart fit" resize: scale the image so its larger side fits the target canvas without cropping, then fill the empty margins with a blurred, scaled-to-cover version of the same photo.
- Size presets: user can create, edit, delete and select presets (name + width × height); ships with a few defaults; persisted between launches.
- Output options: format (keep original / JPEG / PNG) and JPEG quality.
- Progress, per-file result and error reporting during a run, with cancel.
- Distribution as an unsigned `.dmg` / `.zip` built with electron-builder (no Mac App Store). The app uses no network and collects no data.

## Capabilities

### New Capabilities
- `batch-resize`: choosing a folder, discovering images, running the batch, writing results beside originals, progress/cancel/error reporting, output format options.
- `smart-fit`: the resize algorithm — fit by the larger side, blurred-photo background for empty margins.
- `size-presets`: creating, editing, deleting, selecting and persisting size presets.

### Modified Capabilities

(none — greenfield project)

## Impact

- New code: a UI-free TypeScript core (`src/core`: image pipeline, preset store, batch runner) with Vitest unit tests, plus a thin Electron shell (main, preload, renderer).
- Dependencies: Node 20, Electron, `sharp` (libvips), electron-builder, Vitest. HEIC sources are converted with the macOS built-in `sips` tool because prebuilt `sharp` cannot decode HEIC.
- Target: macOS 13+ (Apple Silicon and Intel). No Xcode, Apple Developer account, signing or notarization required; first launch of the unsigned build needs right-click → Open (Gatekeeper).
- Assumptions (recorded, adjustable): non-recursive folder scan by default with an optional "include subfolders" toggle; output files get a size suffix (e.g. `photo_1080x1350.jpg`) to avoid collisions; default output format is JPEG.
