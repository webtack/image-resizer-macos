import * as path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { resolveCanvas } from './fit';
import { loadImage } from './image-loader';
import { smartFit } from './smart-fit';
import { makeTempDir, writeGradient } from './test-fixtures';

/** Reads the RGB(A) value of one pixel from encoded image bytes. */
async function pixel(buf: Buffer, x: number, y: number): Promise<number[]> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * info.channels;
  return Array.from(data.subarray(i, i + info.channels));
}

describe('smartFit', () => {
  it('outputs exactly the canvas size with filled, non-black margins', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'land.jpg');
    await writeGradient(file, 800, 600);
    const img = await loadImage(file);
    const out = await (await smartFit(img, { width: 540, height: 675 })).png().toBuffer();
    await img.dispose();

    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([540, 675]);
    expect(meta.hasAlpha).toBe(false);

    // Photo is 540×405 centred: margins are the top and bottom 135px.
    const corner = await pixel(out, 0, 0);
    expect(corner.reduce((a, b) => a + b, 0)).toBeGreaterThan(60);
    const bottom = await pixel(out, 539, 674);
    expect(bottom.reduce((a, b) => a + b, 0)).toBeGreaterThan(60);
  });

  it('keeps the photo sharp in the centre (gradient preserved left to right)', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'land.jpg');
    await writeGradient(file, 800, 600);
    const img = await loadImage(file);
    const out = await (await smartFit(img, { width: 540, height: 675 })).png().toBuffer();
    await img.dispose();
    const left = await pixel(out, 5, 337);
    const right = await pixel(out, 534, 337);
    expect(left[0]).toBeGreaterThan(200); // red side
    expect(right[2]).toBeGreaterThan(200); // blue side
  });

  it('skips the background when aspect ratios match', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'p.jpg');
    await writeGradient(file, 400, 500);
    const img = await loadImage(file);
    const out = await (await smartFit(img, { width: 200, height: 250 })).png().toBuffer();
    await img.dispose();
    expect((await sharp(out).metadata()).width).toBe(200);
  });

  it('upscales a tiny source to the full canvas', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'tiny.jpg');
    await writeGradient(file, 40, 30);
    const img = await loadImage(file);
    const out = await (await smartFit(img, { width: 108, height: 135 })).jpeg().toBuffer();
    await img.dispose();
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([108, 135]);
  });

  it('composites a transparent PNG over the blur instead of black', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 't.png');
    await writeGradient(file, 400, 300, { alpha: true });
    const img = await loadImage(file);
    const out = await (await smartFit(img, { width: 270, height: 338 })).jpeg().toBuffer();
    await img.dispose();
    const centre = await pixel(out, 135, 169);
    expect(centre.reduce((a, b) => a + b, 0)).toBeGreaterThan(150); // not black
    expect((await sharp(out).metadata()).hasAlpha).toBe(false);
  });

  it('applies EXIF orientation so the output is upright', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'rot.jpg');
    await writeGradient(file, 400, 200, { orientation: 6 }); // appears 200×400
    const img = await loadImage(file);
    const out = await (await smartFit(img, { width: 100, height: 200 })).png().toBuffer();
    await img.dispose();
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([100, 200]);
  });

  it('gives a one-sided result the computed size with no background, transparent PNG over white', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 't.png');
    await writeGradient(file, 400, 300, { alpha: true });
    const img = await loadImage(file);
    const { canvas } = resolveCanvas(img.size, { width: 200, height: null });
    const out = await (await smartFit(img, canvas)).jpeg().toBuffer();
    await img.dispose();
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([200, 150]);
    expect(meta.hasAlpha).toBe(false);
    // Fully transparent source: every pixel, including the corners, is white rather than black.
    for (const [x, y] of [[0, 0], [199, 149], [100, 75]]) {
      expect((await pixel(out, x, y)).every((v) => v > 240)).toBe(true);
    }
  });
});
