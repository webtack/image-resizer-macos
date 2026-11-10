# Design

## Context

The repo has no image assets. `README.md` is short and links to `docs/`; `docs/usage.md` describes
the four UI blocks in text; `docs/smart-fit.md` describes the algorithm with a table of sizes. The
packaged app ships only `dist/**/*` and `package.json`, so files under `docs/` never reach the
`.dmg`/`.zip`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Images render on GitHub from relative paths in `README.md` and `docs/*.md`.
- The "after" image is a genuine output of the app, not a mock-up.
- Licensing of the sample photo is clear and recorded.

**Non-Goals:**
- Scripts that regenerate screenshots automatically.
- Any change to `src/`, `package.json`, presets or build steps.

## Decisions

1. **Location: `docs/images/`.** One folder for every doc image, referenced by relative paths
   (`docs/images/...` from the README, `images/...` from `docs/*.md`). Alternative: a root
   `assets/` folder; rejected because `docs/` is already the mandatory home for documentation.

2. **Photo source: a CC0 photo from Wikimedia Commons (applied).** Unsplash and Pixabay pages block automated access, so author and license could not be verified there; the Commons API exposes both. Original reasoning, kept for context: a free-to-use Unsplash photo. Strictly, Unsplash photos are under the
   *Unsplash License*, not CC0: free for any use, no permission required, attribution appreciated.
   We pick a landscape photo without recognizable people and record author, title and URL in
   `docs/README.md`. Alternatives: the author's own photo (privacy/EXIF risk), a generated gradient
   (does not show the blur effect convincingly). A CC0 photo from Pexels/Pixabay is acceptable if
   it fits better.

3. **"After" produced by the app.** Run the app on the "before" photo with the 1080×1350 preset,
   JPEG quality 90. A landscape source shows the blurred margins above and below most clearly.

4. **Formats and size.** "Before" and "after" as JPEG, longest side ≤ 1200 px, each ≤ ~300 KB. The
   screenshot as PNG, ≤ ~400 KB, taken manually with the window shadow (Cmd+Shift+4, then Space).
   The screenshot shows the app with a folder chosen, a preset selected and the finished run, so
   all four blocks are visible.

5. **Layout of the pair.** Two images side by side in a small Markdown table with captions
   "Before (4:3, landscape)" and "After (1080×1350)". Alternative: a single composite image;
   rejected because it needs extra tooling and is harder to update.

6. **Alt text and docs.** Every image has meaningful English alt text. Doc text that describes the
   UI or the result stays the source of truth; images only illustrate it.

## Risks / Trade-offs

- [Screenshot goes stale when the UI changes] → The project rule already requires updating `docs/`
  on any UI change; the screenshot is a single named file (`docs/images/app-window.png`), so it is
  easy to retake.
- [Repo grows with binary files] → Compress images and cap sizes as in decision 4.
- [Photo license misread as CC0] → Name the exact license and link the source page in
  `docs/README.md`.
- [EXIF metadata leaks location or device] → Strip metadata from the "before" image
  (e.g. `sharp(...).rotate().toFile(...)` without `withMetadata`) before committing.

## Open Questions

- Which exact photo is used. It does not change the tasks; it is chosen during apply and recorded in
  the attribution note.
