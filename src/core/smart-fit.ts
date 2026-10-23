import sharp, { type Sharp } from 'sharp';
import { calculateFit, type Size } from './fit';
import type { LoadedImage } from './image-loader';

/** Blur sigma as a fraction of the larger canvas side (tuned visually, see design.md). */
export const BLUR_SIGMA_RATIO = 0.04;

/** The blurred background is built at 1/BACKGROUND_DOWNSCALE of the canvas, then upscaled back. */
const BACKGROUND_DOWNSCALE = 4;

/**
 * Builds the blurred, cover-scaled background for a canvas.
 *
 * The photo is shrunk first (cheap and gives a smoother blur), its edges are mirrored before
 * blurring so borders do not darken, and the result is upscaled back to the canvas size.
 */
async function buildBackground(image: LoadedImage, canvas: Size): Promise<Buffer> {
  const smallW = Math.max(1, Math.round(canvas.width / BACKGROUND_DOWNSCALE));
  const smallH = Math.max(1, Math.round(canvas.height / BACKGROUND_DOWNSCALE));
  const sigma = Math.max(0.5, (Math.max(canvas.width, canvas.height) * BLUR_SIGMA_RATIO) / BACKGROUND_DOWNSCALE);
  const pad = Math.ceil(sigma * 3);

  // Flatten onto white so transparent sources produce an opaque background.
  const small = await sharp(image.path)
    .rotate()
    .resize(smallW, smallH, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#ffffff' })
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // sharp applies `extract` before `resize` within one pipeline, so blur and crop/upscale are two stages.
  const padded = await sharp(small.data, { raw: small.info })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, extendWith: 'mirror' })
    .blur(sigma)
    .raw()
    .toBuffer({ resolveWithObject: true });

  return sharp(padded.data, { raw: padded.info })
    .extract({ left: pad, top: pad, width: smallW, height: smallH })
    .resize(canvas.width, canvas.height, { fit: 'fill', kernel: 'cubic' })
    .raw()
    .toBuffer();
}

/**
 * Fits a photo onto a canvas of exactly `canvas` size: the whole photo is scaled by its larger side
 * (never cropped) and centred over a blurred, cover-scaled copy of itself.
 *
 * Returns a lazy `sharp` pipeline producing an opaque sRGB image; the caller chooses the encoder.
 *
 * @example
 * const img = await loadImage('/photos/a.jpg');
 * const jpeg = await smartFit(img, { width: 1080, height: 1350 }).jpeg({ quality: 90 }).toBuffer();
 * await img.dispose();
 */
export async function smartFit(image: LoadedImage, canvas: Size): Promise<Sharp> {
  const geometry = calculateFit(image.size, canvas);
  const { foreground } = geometry;

  // No visible margins: a plain resize is enough and no background is needed.
  if (!geometry.hasMargins) {
    return sharp(image.path)
      .rotate()
      .resize(canvas.width, canvas.height, { fit: 'fill', kernel: 'lanczos3' })
      .flatten({ background: '#ffffff' })
      .toColourspace('srgb');
  }

  const [background, fitted] = await Promise.all([
    buildBackground(image, canvas),
    sharp(image.path)
      .rotate()
      .resize(foreground.width, foreground.height, { fit: 'fill', kernel: 'lanczos3' })
      .toColourspace('srgb')
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  return sharp(background, { raw: { width: canvas.width, height: canvas.height, channels: 3 } }).composite([
    { input: fitted.data, raw: fitted.info, left: foreground.left, top: foreground.top },
  ]).removeAlpha(); // the background is opaque, so the composite carries a redundant alpha channel
}
