import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import type { Size } from './fit';

const execFileAsync = promisify(execFile);

/** Extensions that the macOS `sips` tool must convert before `sharp` can decode them. */
const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);

/** A decodable image: a path `sharp` can read, its upright size, and a cleanup hook. */
export interface LoadedImage {
  /** Path that `sharp` can decode (the original, or a temporary JPEG converted from HEIC). */
  path: string;
  /** Size after applying EXIF orientation, i.e. as the photo appears to the user. */
  size: Size;
  /** Removes any temporary file created while loading. Safe to call more than once. */
  dispose(): Promise<void>;
}

/**
 * Prepares an image for processing: converts HEIC/HEIF to a temporary JPEG with `sips`, then reads
 * the upright (EXIF-orientation-aware) dimensions.
 *
 * Callers must `dispose()` the result when done so temporary files do not accumulate.
 *
 * @example
 * const img = await loadImage('/photos/IMG_001.HEIC');
 * try {
 *   console.log(img.size);
 * } finally {
 *   await img.dispose();
 * }
 */
export async function loadImage(file: string): Promise<LoadedImage> {
  let decodable = file;
  let tempDir: string | null = null;

  if (HEIC_EXTENSIONS.has(path.extname(file).toLowerCase())) {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'image-resizer-'));
    decodable = path.join(tempDir, 'converted.jpg');
    try {
      await execFileAsync('/usr/bin/sips', ['-s', 'format', 'jpeg', file, '--out', decodable]);
    } catch (err) {
      await fs.rm(tempDir, { recursive: true, force: true });
      throw new Error(`Cannot convert HEIC image: ${(err as Error).message.split('\n')[0]}`);
    }
  }

  const dispose = async (): Promise<void> => {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  };

  try {
    const meta = await sharp(decodable).metadata();
    if (!meta.width || !meta.height) throw new Error('Cannot read image dimensions');
    // EXIF orientations 5–8 are transposed/rotated by 90°, so width and height swap.
    const swap = (meta.orientation ?? 1) >= 5;
    const size: Size = swap ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height };
    return { path: decodable, size, dispose };
  } catch (err) {
    await dispose();
    throw err;
  }
}
