import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { Size } from './fit';

/** Raised when the destination folder cannot be written to (permissions or read-only volume). */
export class WriteFolderError extends Error {
  constructor(folder: string) {
    super(`Cannot write to folder: ${folder}`);
    this.name = 'WriteFolderError';
  }
}

/** Error codes that mean "not allowed to write here". */
const PERMISSION_CODES = new Set(['EACCES', 'EPERM', 'EROFS']);

/**
 * Builds the output file name `<stem>_<W>x<H>[-n].<ext>`.
 *
 * @example
 * outputName('IMG_001.jpg', { width: 1080, height: 1350 }, 'jpg'); // 'IMG_001_1080x1350.jpg'
 * outputName('IMG_001.jpg', { width: 1080, height: 1350 }, 'jpg', 1); // 'IMG_001_1080x1350-1.jpg'
 */
export function outputName(sourceFile: string, canvas: Size, ext: string, counter = 0): string {
  const stem = path.parse(sourceFile).name;
  const suffix = counter > 0 ? `-${counter}` : '';
  return `${stem}_${canvas.width}x${canvas.height}${suffix}.${ext}`;
}

/**
 * Writes `data` beside `sourceFile` under the output name, never overwriting an existing file.
 *
 * The bytes go to a temporary file in the same folder first and are then hard-linked to the final
 * name: `link` fails if the name is taken (so we bump the counter), and the final name only ever
 * appears fully written, so a crash or cancel cannot leave a partial output.
 * Permission errors are reported as {@link WriteFolderError}.
 *
 * @example
 * const out = await writeOutput('/photos/a.jpg', jpegBytes, { width: 1080, height: 1350 }, 'jpg');
 * // '/photos/a_1080x1350.jpg'
 */
export async function writeOutput(sourceFile: string, data: Buffer, canvas: Size, ext: string): Promise<string> {
  const dir = path.dirname(sourceFile);
  const tmp = path.join(dir, `.${path.parse(sourceFile).name}.${process.pid}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.tmp`);
  try {
    await fs.writeFile(tmp, data, { flag: 'wx' });
    for (let counter = 0; ; counter++) {
      const dest = path.join(dir, outputName(sourceFile, canvas, ext, counter));
      try {
        await fs.link(tmp, dest);
        return dest;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
      }
    }
  } catch (err) {
    if (PERMISSION_CODES.has((err as NodeJS.ErrnoException).code ?? '')) throw new WriteFolderError(dir);
    throw err;
  } finally {
    await fs.rm(tmp, { force: true }).catch(() => undefined);
  }
}
