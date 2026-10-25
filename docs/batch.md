# Batch processing

## Image discovery

After a folder is chosen, the app collects all supported files: `.jpg`, `.jpeg`, `.png`, `.heic`,
`.heif`, `.tif`, `.tiff`, `.webp` (extension case does not matter). Other files are ignored.

- Subfolders are scanned only when the **Include subfolders** switch is on.
- Folders named `resized` (case-insensitive) are never scanned: that is the app's output folder. If
  you have your own `resized` folder with source photos, they will not be found.
- Hidden files and folders (names starting with a dot) are skipped.
- Files previously created by the app for the **selected preset** (`<name>_<W>x<H>` or
  `<name>_<W>x<H>-<n>`) are not treated as sources, so a repeated run does not process its own results.
- If there are no images, the message `No images found` is shown and the Run button is disabled.

## Result naming

Each result is saved to the **`resized`** subfolder of the original's folder (created if needed) as
`<name>_<W>x<H>.<ext>`. Originals are never modified or deleted.

For subfolders (with **Include subfolders** on), the **Save subfolder results** option decides where
results go:

| Mode | Result for `folder1/trip/IMG.jpg` (`folder1` selected) |
| --- | --- |
| **Each folder has its own resized** (default) | `folder1/trip/resized/IMG_<W>x<H>.jpg` |
| **One resized in the selected folder** | `folder1/resized/IMG_<W>x<H>.jpg` |

In the single-folder mode the subfolder structure is not reproduced, and files with the same name from
different subfolders are told apart by a counter. For images directly in the selected folder the choice
has no effect. The option is available only with **Include subfolders** on.

| Original | Preset | Format | Result |
| --- | --- | --- | --- |
| `IMG_001.jpg` | 1080×1350 | JPEG | `resized/IMG_001_1080x1350.jpg` |
| `scan.png` | 1920×1080 | Keep original | `resized/scan_1920x1080.png` |
| `IMG_002.HEIC` | 1080×1080 | Keep original | `resized/IMG_002_1080x1080.jpg` |

Existing files are not overwritten: if `resized/IMG_001_1080x1350.jpg` already exists, the new file
gets a counter — `resized/IMG_001_1080x1350-1.jpg`, then `-2`, and so on.

Writing is atomic: data first goes to a temporary file in the `resized` folder and only then appears
under its final name, so cancellation or a crash never leaves half-written files.

## Formats and quality

| Choice | Behavior |
| --- | --- |
| Keep original | JPEG, PNG, WebP and TIFF keep their format; everything else (for example, HEIC) becomes JPEG |
| JPEG | always `.jpg` |
| PNG | always `.png`, lossless |

JPEG quality (and WebP/TIFF in Keep original mode) ranges from 1 to 100, default **90**. Quality does
not apply to PNG. Transparent areas of images are filled with the blurred background (see
[smart-fit.md](smart-fit.md)).

## Concurrency

`max(2, floor(cpus / 2))` files are processed at a time. `sharp` threads are shared between workers so
the CPU is not overloaded.

## Errors and cancellation

- An error on one file does **not** stop the rest. The file is marked as failed with a reason, and at
  the end a "succeeded / failed" summary is shown.
- If the folder is not writable (for example, read-only), every file gets the reason
  `Cannot write to folder`, and the app does not crash.
- A damaged or unreadable file (including a corrupt HEIC) gets the reason reported by the decoder.
- **Cancel** stops starting new files: files in progress finish, completed results are kept, and the
  rest are marked as skipped (not processed).
