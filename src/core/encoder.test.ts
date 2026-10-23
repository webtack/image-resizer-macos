import * as path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { encode, normalizeQuality, resolveFormat } from './encoder';
import { loadImage } from './image-loader';
import { smartFit } from './smart-fit';
import { makeTempDir, writeGradient } from './test-fixtures';

describe('resolveFormat', () => {
  it('forces jpeg or png regardless of source', () => {
    expect(resolveFormat('a.png', 'jpeg')).toEqual({ codec: 'jpeg', ext: 'jpg' });
    expect(resolveFormat('a.jpg', 'png')).toEqual({ codec: 'png', ext: 'png' });
  });

  it('keeps JPEG, PNG, WebP and TIFF and falls back to JPEG for HEIC', () => {
    expect(resolveFormat('a.JPEG', 'keep').codec).toBe('jpeg');
    expect(resolveFormat('a.png', 'keep').codec).toBe('png');
    expect(resolveFormat('a.webp', 'keep').codec).toBe('webp');
    expect(resolveFormat('a.tiff', 'keep').codec).toBe('tiff');
    expect(resolveFormat('a.heic', 'keep')).toEqual({ codec: 'jpeg', ext: 'jpg' });
  });
});

describe('normalizeQuality', () => {
  it('clamps and defaults', () => {
    expect(normalizeQuality(undefined)).toBe(90);
    expect(normalizeQuality(0)).toBe(1);
    expect(normalizeQuality(500)).toBe(100);
    expect(normalizeQuality(80)).toBe(80);
  });
});

describe('encode', () => {
  it('encodes a PNG source as JPEG, and quality changes the byte size', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'a.png');
    await writeGradient(file, 600, 400);
    const img = await loadImage(file);
    const fmt = resolveFormat(file, 'jpeg');
    const low = await encode(await smartFit(img, { width: 300, height: 400 }), fmt, 10);
    const high = await encode(await smartFit(img, { width: 300, height: 400 }), fmt, 95);
    await img.dispose();
    expect((await sharp(low).metadata()).format).toBe('jpeg');
    expect(high.length).toBeGreaterThan(low.length);
  });
});
