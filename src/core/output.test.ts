import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { outputName, WriteFolderError, writeOutput } from './output';
import { makeTempDir } from './test-fixtures';

const canvas = { width: 1080, height: 1350 };

describe('outputName', () => {
  it('builds <stem>_<W>x<H>.<ext> and appends a counter', () => {
    expect(outputName('/p/IMG_001.jpg', canvas, 'jpg')).toBe('IMG_001_1080x1350.jpg');
    expect(outputName('/p/IMG_001.jpg', canvas, 'jpg', 2)).toBe('IMG_001_1080x1350-2.jpg');
  });
});

describe('writeOutput', () => {
  it('writes beside the original and leaves the original untouched', async () => {
    const dir = await makeTempDir();
    const src = path.join(dir, 'IMG_001.jpg');
    await fs.writeFile(src, 'original');
    const out = await writeOutput(src, Buffer.from('new'), canvas, 'jpg');
    expect(out).toBe(path.join(dir, 'IMG_001_1080x1350.jpg'));
    expect(await fs.readFile(src, 'utf8')).toBe('original');
    expect(await fs.readFile(out, 'utf8')).toBe('new');
  });

  it('appends a counter instead of overwriting an existing file', async () => {
    const dir = await makeTempDir();
    const src = path.join(dir, 'IMG_001.jpg');
    await fs.writeFile(src, 'original');
    await fs.writeFile(path.join(dir, 'IMG_001_1080x1350.jpg'), 'existing');
    const out = await writeOutput(src, Buffer.from('new'), canvas, 'jpg');
    expect(path.basename(out)).toBe('IMG_001_1080x1350-1.jpg');
    expect(await fs.readFile(path.join(dir, 'IMG_001_1080x1350.jpg'), 'utf8')).toBe('existing');
  });

  it('leaves no temporary files behind', async () => {
    const dir = await makeTempDir();
    const src = path.join(dir, 'a.jpg');
    await fs.writeFile(src, 'o');
    await writeOutput(src, Buffer.from('n'), canvas, 'jpg');
    expect((await fs.readdir(dir)).filter((n) => n.endsWith('.tmp'))).toEqual([]);
  });

  it('reports a read-only folder as WriteFolderError', async () => {
    const dir = await makeTempDir();
    const src = path.join(dir, 'a.jpg');
    await fs.writeFile(src, 'o');
    await fs.chmod(dir, 0o555);
    try {
      await expect(writeOutput(src, Buffer.from('n'), canvas, 'jpg')).rejects.toBeInstanceOf(WriteFolderError);
    } finally {
      await fs.chmod(dir, 0o755);
    }
  });
});
