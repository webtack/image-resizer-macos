# Design

## Context

`writeOutput` in `src/core/output.ts` writes a temp file beside the source, then hard-links it to the final name (so an existing name bumps the counter and no partial file is ever visible). `discoverImages` in `src/core/discovery.ts` walks folders and skips hidden entries and prior outputs of the selected preset. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Keep the atomic, never-overwrite write semantics, only changing the destination folder.
- Make repeated runs idempotent when "Include subfolders" is on.

**Non-Goals:**
- A user-configurable output folder name or location.
- Migrating or moving results of earlier runs.

## Decisions

- **Fixed `resized` subfolder per source folder**, exported as a constant `OUTPUT_FOLDER_NAME`. Alternative: folder named after the output extension — rejected, "Keep original" would split one run across several folders and the extension is not known to the user up front.
- **`writeOutput` takes an `outputDir` base: the source folder in "each folder" mode or the selected folder in "one folder" mode (chosen by `processFile` from new `BatchOptions` fields `outputMode` and `outputRoot`). It computes `dir = <base>/resized`, runs `fs.mkdir(dir, { recursive: true })`, and writes the temp file and hard link there.** The temp file must live on the same folder as the target for `link` to be atomic and valid, so it moves with the destination. Alternative: a single fixed behavior — rejected, both layouts are wanted. In "one folder" mode same-named files from different subfolders are separated by the existing collision counter; the tree is not mirrored.
- **UI: a select "Save subfolder results" with values `each` (default) / `single`, placed under "Include subfolders" and disabled while that checkbox is off.** It is passed in `RunOptions` (`src/shared/api.ts`); `ipc.ts` supplies `selectedFolder` as `outputRoot`, so the renderer never sends paths. The choice is not persisted (matches the other run options). Parallel workers racing on `mkdir` are safe because `recursive: true` ignores an existing directory.
- **Discovery skips any directory entry named `resized` (compared case-insensitively, since macOS volumes usually are).** Alternative: rely on `isPreviousOutput` alone — rejected, it only matches the selected preset, so outputs for other presets would be re-processed.
- **Keep the `_<W>x<H>` suffix and `isPreviousOutput`** so files from earlier runs beside originals are still ignored and the preset stays visible in the name.
- **Permission failures** (`EACCES`/`EPERM`/`EROFS`) from `mkdir` or the write keep mapping to `WriteFolderError`, reporting the source folder so the existing `Cannot write to folder` reason is unchanged.

## Risks / Trade-offs

- [A regular file named `resized` blocks folder creation] → `mkdir` fails with `EEXIST`/`ENOTDIR`; the file is marked failed with the error message, the batch continues.
- [A user's own folder named `resized` containing sources is never scanned] → documented in `docs/batch.md`.
- [Existing tests assume outputs beside originals] → updated in the same change.
