import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverImages, isPreviousOutput } from './discovery';
import { makeTempDir } from './test-fixtures';

/** Creates empty files (relative paths) inside `root`, making folders as needed. */
async function touch(root: string, names: string[]): Promise<void> {
  for (const n of names) {
    await fs.mkdir(path.dirname(path.join(root, n)), { recursive: true });
    await fs.writeFile(path.join(root, n), 'x');
  }
}

describe('discoverImages', () => {
  it('lists only supported images from a mixed folder', async () => {
    const dir = await makeTempDir();
    await touch(dir, ['1.jpg', '2.JPEG', '3.jpg', '4.jpg', '5.jpg', 'a.png', 'b.PNG', 'n1.txt', 'n2.md', 'n3.pdf', '.hidden.jpg']);
    const files = await discoverImages(dir);
    expect(files.map((f) => path.basename(f))).toEqual(['1.jpg', '2.JPEG', '3.jpg', '4.jpg', '5.jpg', 'a.png', 'b.PNG']);
  });

  it('scans subfolders only when recursive is on', async () => {
    const dir = await makeTempDir();
    await touch(dir, ['top.jpg', 'sub/deep.png', 'sub/inner/x.webp', '.git/ignored.jpg']);
    expect(await discoverImages(dir)).toHaveLength(1);
    const all = await discoverImages(dir, { recursive: true });
    expect(all.map((f) => path.relative(dir, f))).toEqual(['sub/deep.png', 'sub/inner/x.webp', 'top.jpg']);
  });

  it('skips previous outputs of the selected preset, including collision counters', async () => {
    const dir = await makeTempDir();
    await touch(dir, ['photo.jpg', 'photo_1080x1350.jpg', 'photo_1080x1350-1.jpg', 'other_1920x1080.jpg']);
    const files = await discoverImages(dir, { preset: { width: 1080, height: 1350 } });
    expect(files.map((f) => path.basename(f))).toEqual(['other_1920x1080.jpg', 'photo.jpg']);
  });

  it('skips previous outputs of a one-sided preset but keeps unrelated sizes', async () => {
    const dir = await makeTempDir();
    await touch(dir, ['photo.jpg', 'photo_1000x750.jpg', 'photo_1013x1350-1.jpg', 'photo_800x600.jpg']);
    const names = async (preset: { width: number | null; height: number | null }) =>
      (await discoverImages(dir, { preset })).map((f) => path.basename(f));
    expect(await names({ width: 1000, height: null })).toEqual(['photo.jpg', 'photo_1013x1350-1.jpg', 'photo_800x600.jpg']);
    expect(await names({ width: null, height: 1350 })).toEqual(['photo.jpg', 'photo_1000x750.jpg', 'photo_800x600.jpg']);
  });

  it('never enters a resized folder, in any letter case, with or without recursive', async () => {
    const dir = await makeTempDir();
    await touch(dir, ['top.jpg', 'resized/old.jpg', 'sub/Resized/old2.jpg', 'sub/keep.png']);
    expect((await discoverImages(dir)).map((f) => path.relative(dir, f))).toEqual(['top.jpg']);
    const all = await discoverImages(dir, { recursive: true });
    expect(all.map((f) => path.relative(dir, f))).toEqual(['sub/keep.png', 'top.jpg']);
  });
});

describe('isPreviousOutput', () => {
  it('matches only the selected preset size', () => {
    expect(isPreviousOutput('a_1080x1350.jpg', { width: 1080, height: 1350 })).toBe(true);
    expect(isPreviousOutput('a_1080x1350.jpg', { width: 1080, height: 1080 })).toBe(false);
    expect(isPreviousOutput('a_1080x13500.jpg', { width: 1080, height: 1350 })).toBe(false);
  });

  it('matches any value for an open side', () => {
    expect(isPreviousOutput('a_1000x750.jpg', { width: 1000, height: null })).toBe(true);
    expect(isPreviousOutput('a_1013x1350-2.jpg', { width: null, height: 1350 })).toBe(true);
    expect(isPreviousOutput('a_800x600.jpg', { width: 1000, height: null })).toBe(false);
  });
});
