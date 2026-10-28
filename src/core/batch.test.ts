import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBatch } from './batch';
import { discoverImages } from './discovery';
import { makeTempDir, writeGradient, writeHeic } from './test-fixtures';

const canvas = { width: 108, height: 135 };

/** Creates a folder with `good` valid JPEGs and `bad` corrupt ones; returns the folder. */
async function makeFolder(good: number, bad = 0): Promise<string> {
  const dir = await makeTempDir();
  for (let i = 0; i < good; i++) await writeGradient(path.join(dir, `ok${String(i).padStart(2, '0')}.jpg`), 200, 150);
  for (let i = 0; i < bad; i++) await fs.writeFile(path.join(dir, `bad${i}.jpg`), 'corrupt');
  return dir;
}

describe('runBatch', () => {
  it('isolates a corrupt file: 9 succeed, 1 fails with a reason', async () => {
    const dir = await makeFolder(9, 1);
    const files = await discoverImages(dir);
    const summary = await runBatch(files, { target: canvas, format: 'jpeg', concurrency: 3 });
    expect(summary.succeeded).toBe(9);
    expect(summary.failed).toBe(1);
    const failed = summary.results.find((r) => r.status === 'failed');
    expect(failed?.file).toContain('bad0.jpg');
    expect(failed?.error).toBeTruthy();
    expect(await fs.readdir(path.join(dir, 'resized'))).toContain('ok00_108x135.jpg');
  });

  it('names one-sided results with the real size of each image', async () => {
    const dir = await makeTempDir();
    await writeGradient(path.join(dir, 'a.jpg'), 400, 300);
    await writeGradient(path.join(dir, 'b.jpg'), 300, 400);
    const summary = await runBatch(await discoverImages(dir), { target: { width: 100, height: null }, format: 'jpeg', concurrency: 1 });
    expect(summary.succeeded).toBe(2);
    expect((await fs.readdir(path.join(dir, 'resized'))).sort()).toEqual(['a_100x75.jpg', 'b_100x133.jpg']);
  });

  it('cancel stops new files, keeps finished outputs and marks the rest skipped', async () => {
    const dir = await makeFolder(10);
    const files = await discoverImages(dir);
    const controller = new AbortController();
    const summary = await runBatch(files, {
      target: canvas,
      format: 'jpeg',
      concurrency: 1,
      signal: controller.signal,
      onResult: (_r, completed) => {
        if (completed === 3) controller.abort();
      },
    });
    expect(summary.succeeded).toBe(3);
    expect(summary.skipped).toBe(7);
    const outputs = (await fs.readdir(path.join(dir, 'resized'))).filter((n) => n.includes('_108x135'));
    expect(outputs).toHaveLength(3);
  });

  it('reports progress for every file', async () => {
    const dir = await makeFolder(4);
    const seen: number[] = [];
    await runBatch(await discoverImages(dir), { target: canvas, format: 'png', onResult: (_r, done, total) => seen.push(done * 10 + total) });
    expect(seen.sort()).toEqual([14, 24, 34, 44]);
  });

  it('marks files failed with "Cannot write to folder" on a read-only folder and keeps going', async () => {
    const dir = await makeFolder(3);
    const files = await discoverImages(dir);
    await fs.chmod(dir, 0o555);
    try {
      const summary = await runBatch(files, { target: canvas, format: 'jpeg', concurrency: 2 });
      expect(summary.failed).toBe(3);
      expect(summary.results.every((r) => r.error === 'Cannot write to folder')).toBe(true);
    } finally {
      await fs.chmod(dir, 0o755);
    }
  });

  it('converts HEIC to JPEG when keeping the original format', async () => {
    const dir = await makeTempDir();
    await writeHeic(path.join(dir, 'pic.heic'), 160, 120);
    const summary = await runBatch(await discoverImages(dir), { target: canvas, format: 'keep', concurrency: 1 });
    expect(summary.succeeded).toBe(1);
    expect(path.basename(summary.results[0].output!)).toBe('pic_108x135.jpg');
  });

  it('each mode: puts results into the resized folder of each source folder', async () => {
    const root = await makeFolder(1);
    const nested = path.join(root, 'trip');
    await fs.mkdir(nested);
    await writeGradient(path.join(nested, 'deep.jpg'), 200, 150);
    const files = await discoverImages(root, { recursive: true });
    await runBatch(files, { target: canvas, format: 'jpeg', outputMode: 'each', outputRoot: root });
    expect(await fs.readdir(path.join(root, 'resized'))).toEqual(['ok00_108x135.jpg']);
    expect(await fs.readdir(path.join(nested, 'resized'))).toEqual(['deep_108x135.jpg']);
  });

  it('single mode: puts all results into the selected folder and numbers same-name files', async () => {
    const root = await makeTempDir();
    for (const sub of ['a', 'b', 'a/inner']) {
      await fs.mkdir(path.join(root, sub), { recursive: true });
      await writeGradient(path.join(root, sub, 'IMG.jpg'), 200, 150);
    }
    const files = await discoverImages(root, { recursive: true });
    const summary = await runBatch(files, { target: canvas, format: 'jpeg', outputMode: 'single', outputRoot: root, concurrency: 1 });
    expect(summary.succeeded).toBe(3);
    expect((await fs.readdir(path.join(root, 'resized'))).sort()).toEqual(['IMG_108x135-1.jpg', 'IMG_108x135-2.jpg', 'IMG_108x135.jpg']);
    await expect(fs.stat(path.join(root, 'a', 'resized'))).rejects.toThrow();
  });

  it('handles an empty list', async () => {
    const summary = await runBatch([], { target: canvas, format: 'jpeg' });
    expect(summary).toMatchObject({ succeeded: 0, failed: 0, skipped: 0 });
  });
});
