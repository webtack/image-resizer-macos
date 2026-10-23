import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadImage } from './image-loader';
import { makeTempDir, writeGradient, writeHeic } from './test-fixtures';

describe('loadImage', () => {
  it('reports upright dimensions for an EXIF-rotated JPEG', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'rot.jpg');
    // Stored 400×200 with orientation 6 (rotate 90°) → appears 200×400.
    await writeGradient(file, 400, 200, { orientation: 6 });
    const img = await loadImage(file);
    expect(img.size).toEqual({ width: 200, height: 400 });
    await img.dispose();
  });

  it('keeps dimensions for an unrotated JPEG', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'a.jpg');
    await writeGradient(file, 300, 100);
    const img = await loadImage(file);
    expect(img.size).toEqual({ width: 300, height: 100 });
    await img.dispose();
  });

  it('decodes HEIC through sips and removes the temp file on dispose', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'a.heic');
    await writeHeic(file, 320, 240);
    const img = await loadImage(file);
    expect(img.path).not.toBe(file);
    expect(img.size.width * img.size.height).toBe(320 * 240);
    await img.dispose();
    await expect(fs.access(img.path)).rejects.toThrow();
  });

  it('rejects a corrupt file', async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, 'bad.jpg');
    await fs.writeFile(file, 'not an image');
    await expect(loadImage(file)).rejects.toThrow();
  });
});
