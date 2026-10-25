# User guide

## First launch

An unsigned build is blocked by Gatekeeper. Right-click the app → **Open** → **Open** (details in
[release.md](release.md)). After that it launches normally.

## Step by step

1. **Choose a folder.** In block **1. Folder**, click **Choose folder…** or drag a folder onto the app
   window. The app shows the number of images and their list.
   - To process subfolders too, turn on **Include subfolders**. This enables
     **Save subfolder results**: each folder gets its own `resized` (default), or there is a single
     `resized` in the selected folder.
   - If there are no supported images, `No images found` appears and Run is disabled.
2. **Choose a preset.** In block **2. Size**, pick a size from the list or create your own via
   **Manage presets…** (see [presets.md](presets.md)).
3. **Choose a format.** In block **3. Output**, pick **Format** — JPEG (default), PNG or
   Keep original — and **Quality** (1–100, default 90; does not apply to PNG).
4. **Run.** Click **Run**. Block **4. Run** shows a progress bar and the status of each file:
   `✓` done, `✗` error with a reason, `–` not processed. At the end a summary appears:
   `Done: N succeeded, M failed`.
5. **Cancel.** **Cancel** stops starting new files; results that are already done are kept.

Results are placed in the `resized` subfolder next to the originals: `IMG_001.jpg` →
`resized/IMG_001_1080x1350.jpg` (naming rules are in [batch.md](batch.md)). The app does not scan
`resized` folders, so a repeated run does not process its own results. Originals are not modified.

The **Run** button is active only when a folder with at least one image and a preset are selected.

## Common errors

| Message | Cause and what to do |
| --- | --- |
| `No images found` | The folder has no `.jpg/.jpeg/.png/.heic/.heif/.tif/.tiff/.webp`; choose another folder or turn on Include subfolders |
| `Cannot write to folder` | No write permission (read-only folder); choose a folder you can write to |
| `Input file contains unsupported image format` | The file is damaged or not an image; the other files continue to be processed |
| `Cannot convert HEIC image` | `sips` could not read the HEIC; check the file |

## Privacy

The app works offline: it makes no network requests and collects no data. Reading and writing happen
only inside the selected (or dropped) folder.
