import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

/** Creates an empty temp directory for a test. */
export async function makeTempDir(prefix = 'resizer-test-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/**
 * Writes a left-to-right red→blue gradient image so tests can tell orientation and colour apart.
 * Format is chosen by the file extension (jpg/png).
 */
export async function writeGradient(file: string, width: number, height: number, opts: { orientation?: number; alpha?: boolean } = {}): Promise<void> {
  const channels = opts.alpha ? 4 : 3;
  const data = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const t = x / Math.max(1, width - 1);
      data[i] = Math.round(255 * (1 - t));
      data[i + 1] = 40;
      data[i + 2] = Math.round(255 * t);
      if (channels === 4) data[i + 3] = 0; // fully transparent
    }
  }
  let img = sharp(data, { raw: { width, height, channels } });
  if (opts.orientation) img = img.withMetadata({ orientation: opts.orientation });
  await (file.endsWith('.png') ? img.png() : img.jpeg({ quality: 95 })).toFile(file);
}

/** Converts a JPEG into a HEIC file using the macOS `sips` tool (fixture for HEIC tests). */
export async function writeHeic(file: string, width: number, height: number): Promise<void> {
  const jpg = `${file}.src.jpg`;
  await writeGradient(jpg, width, height);
  await execFileAsync('/usr/bin/sips', ['-s', 'format', 'heic', jpg, '--out', file]);
  await fs.rm(jpg);
}
