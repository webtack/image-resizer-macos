# Smart fit

With a two-sided preset the app produces a canvas of **exactly** the requested size (for example,
1080×1350). With a one-sided preset the photo is scaled proportionally instead (see
[Proportional resize](#proportional-resize)). The photo itself is never cropped.

## How it works

1. **Orientation.** The EXIF orientation tag is applied, so a rotated photo comes out upright.
   HEIC/HEIF is first converted to a temporary JPEG using the `sips` tool built into macOS.
2. **Fit by the longer side.** The photo is scaled, keeping its proportions, so that it fits entirely
   inside the canvas: scale = `min(W / width, H / height)`. Small photos are enlarged (Lanczos3
   interpolation). The photo is centered.
3. **Blurred background.** If margins remain after fitting (more than 1 px), they are filled with the
   same photo scaled to cover the whole canvas (`cover`, with cropping) and blurred.
4. **Compositing.** The sharp photo is placed in the center of the blurred background. The result is
   opaque sRGB. Transparent areas of a PNG are placed over the blurred background, not over black.

If the photo's proportions match the canvas, no background is needed and the photo is simply scaled.

## Proportional resize

If a preset has only a **width** or only a **height**, the other side is calculated for every photo
from its own proportions, so the whole photo is kept and no margins appear:

- width only: `height = round(sourceHeight × width / sourceWidth)`
- height only: `width = round(sourceWidth × height / sourceHeight)`

The computed side is rounded to the nearest whole pixel and limited to 1–16384 (`resolveCanvas` in
`src/core/fit.ts`). Because of this limit, an extreme panorama can still end up with margins, which are
filled with the blurred background as usual. Small photos are enlarged (Lanczos3). Transparent PNG areas
become white when written as JPEG. Results in one run can have different sizes, and the file name
carries the real size (see [batch.md](batch.md)).

| Source photo | Preset | Result |
| --- | --- | --- |
| 4000×3000 | width 1080 | 1080×810 |
| 3000×4000 | height 1350 | 1013×1350 (1012.5 rounded) |
| 4000×3000 / 3000×4000 | width 1000 | 1000×750 / 1000×1333 |
| 400×300 | width 1080 | 1080×810 (enlarged) |
| 20000×100 | height 1000 | 16384×1000 (width clamped) |

## Blur radius

The blur sigma is **4 %** of the canvas's longer side (the constant `BLUR_SIGMA_RATIO = 0.04` in
`src/core/smart-fit.ts`). Blurring is done on a copy downscaled 4× with mirrored edges (so the edges
do not darken), and the result is scaled back up. The value was tuned visually: the background reads as
an "ambient" color rather than a duplicate of the photo.

## Examples

| Source photo | Canvas | Result |
| --- | --- | --- |
| 4000×3000 | 1080×1350 | 1080×810 photo centered, 270 px of blurred background above and below |
| 2000×2500 | 1080×1350 | photo fills the whole canvas, no background |
| 400×300 | 1080×1350 | photo enlarged to 1080×810, margins are blurred background |
| 6000×1000 | 1080×1080 | 1080×180 photo centered, the rest is blurred background |
| 3000×4000 | 1920×1080 | 810×1080 photo centered, 555 px of blurred background on each side |

These sizes are verified by the unit tests `src/core/fit.test.ts` and `src/core/smart-fit.test.ts`.
