import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { TargetSize } from './fit';
import { OUTPUT_FOLDER_NAME } from './output';

/** File extensions (lowercase, with dot) the app accepts as source images. */
export const SUPPORTED_EXTENSIONS: ReadonlySet<string> = new Set([
  '.jpg', '.jpeg', '.png', '.heic', '.heif', '.tif', '.tiff', '.webp',
]);

/** Options for {@link discoverImages}. */
export interface DiscoveryOptions {
  /** Scan subfolders too. Defaults to false. */
  recursive?: boolean;
  /**
   * When set, files named like this preset's outputs (`<name>_<W>x<H>[-n]`) are skipped. A `null`
   * side matches any number, because one-sided presets produce a different size per image.
   */
  preset?: TargetSize;
}

/**
 * Tells whether a file name looks like an output previously produced for `preset`,
 * i.e. its stem ends with `_<W>x<H>` optionally followed by a collision counter `-<n>`.
 * For a one-sided preset the open side matches any digits.
 *
 * @example
 * isPreviousOutput('photo_1080x1350.jpg', { width: 1080, height: 1350 }); // true
 * isPreviousOutput('photo_1000x750.jpg', { width: 1000, height: null }); // true
 */
export function isPreviousOutput(fileName: string, preset: TargetSize): boolean {
  const stem = path.parse(fileName).name;
  return new RegExp(`_${preset.width ?? '\\d+'}x${preset.height ?? '\\d+'}(-\\d+)?$`).test(stem);
}

/**
 * Lists supported images in `folder`, sorted by path. Hidden files and folders (leading dot) are
 * ignored, folders named `resized` (our output folder, any letter case) are never entered,
 * symbolic links are not followed, and previous outputs for the selected preset are
 * excluded so a second run never re-processes its own results.
 *
 * @example
 * const files = await discoverImages('/Users/me/Photos', { recursive: true, preset: { width: 1080, height: 1350 } });
 */
export async function discoverImages(folder: string, options: DiscoveryOptions = {}): Promise<string[]> {
  const found: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.toLowerCase() === OUTPUT_FOLDER_NAME) continue;
        if (options.recursive) await walk(full);
      } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        if (options.preset && isPreviousOutput(entry.name, options.preset)) continue;
        found.push(full);
      }
    }
  }

  await walk(folder);
  return found.sort();
}
