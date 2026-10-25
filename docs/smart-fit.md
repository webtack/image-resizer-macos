# Smart fit

The app always produces a canvas of **exactly** the requested size (for example, 1080×1350). The
photo itself is never cropped.

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
