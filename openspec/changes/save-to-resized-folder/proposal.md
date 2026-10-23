# Proposal

## Why

Results are currently written next to the originals, so a folder quickly fills with a mix of source and resized files. Users want the resized images kept apart from the originals so they are easy to find, copy or delete as a set.

## What Changes

- Each resized image is saved into a `resized` subfolder of the folder that holds its original (created on demand), instead of beside the original. Example: photos in `folder1` produce results in `folder1/resized`.
- File naming inside `resized` stays `<name>_<W>x<H>[-n].<ext>`, so the preset stays visible in the name and collision counters keep working.
- Discovery never descends into a folder named `resized`, so "Include subfolders" does not re-process earlier results.
- A new option **Save subfolder results** (visible when "Include subfolders" is on) lets the user choose where results from subfolders go:
  - **Each folder has its own `resized`** (default): `folder1/trip/IMG.jpg` → `folder1/trip/resized/`.
  - **One `resized` in the selected folder**: all results from subfolders go flat into `folder1/resized/`; name collisions get a counter.
- Documentation in `docs/` is updated (Ukrainian).

Assumption: the folder name is the fixed string `resized`. A per-extension folder name (e.g. `jpg/`) was considered but rejected because "Keep original" would scatter one run across several folders.

## Capabilities

### New Capabilities

### Modified Capabilities
- `batch-resize`: output location changes from "beside the original" to the `resized` subfolder; discovery excludes `resized` folders.

## Impact

- Code: `src/core/output.ts` (destination folder, folder creation), `src/core/discovery.ts` (skip `resized`), `src/core/batch.ts`, `src/main/ipc.ts`, `src/shared/api.ts`, `src/renderer/index.html` and `renderer.ts` (new option, passed as run option) and their tests.
- Docs: `docs/batch.md`, `docs/usage.md`.
- No new dependencies. Originals are still never modified.
