# Tasks

## 1. Sample photo and "before / after" images

- [x] 1.1 Pick a landscape photo without recognizable people under a free license (Unsplash and Pixabay block automated access, so Wikimedia Commons CC0 is used); note author, title and page URL. Verify the license via the Commons API.
- [x] 1.2 Save it as `docs/images/before.jpg` (longest side ≤ 1200 px, metadata stripped, ≤ ~300 KB). Verify with `sharp` or `file` that the size is within limits and no EXIF GPS data remains.
- [x] 1.3 Run the app on that photo with the 1080×1350 preset, JPEG quality 90, and copy the result to `docs/images/after.jpg` (≤ ~300 KB). Verify the image is 1080×1350 and shows blurred margins above and below.

## 2. UI screenshot

- [x] 2.1 Run `npm start`, choose a folder with the sample photo, select the 1080×1350 preset, run, and capture the window to `docs/images/app-window.png` (≤ ~400 KB). Verify all four blocks (Folder, Size, Output, Run) and the `Done: 1 succeeded, 0 failed` summary are visible.

## 3. Documentation

- [x] 3.1 Add the screenshot and the before/after table (with English alt text and captions) to `README.md`. Verify the images render by previewing the Markdown, and that the paths are relative to the repo root.
- [x] 3.2 Add the screenshot to `docs/usage.md` before "Step by step" and the before/after pair to `docs/smart-fit.md` under "How it works". Verify the relative paths (`images/...`) resolve from `docs/`.
- [x] 3.3 Add a "Sample photo credits" section to `docs/README.md` with author, title, source link and the exact license name (CC0 1.0), and add `docs/images/` to its documentation-structure table. Verify the link and wording against the photo's source page.

## 4. Final checks

- [x] 4.1 Run `git status` and confirm only `README.md`, `docs/` and `openspec/` files changed and no `src/` or `package.json` changes; run `npm test` to confirm nothing else is affected.
- [x] 4.2 Run `openspec validate add-readme-screenshots` and confirm it passes.
