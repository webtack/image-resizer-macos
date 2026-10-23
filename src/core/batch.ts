import * as os from 'node:os';
import sharp from 'sharp';
import { encode, resolveFormat, type OutputFormat } from './encoder';
import type { Size } from './fit';
import type { BatchSummary, FileResult } from '../shared/types';
import { loadImage } from './image-loader';
import { WriteFolderError, writeOutput } from './output';
import { smartFit } from './smart-fit';

/** Settings for one batch run. */
export interface BatchOptions {
  canvas: Size;
  format: OutputFormat;
  /** JPEG/WebP quality 1–100; defaults to 90. */
  quality?: number;
  /** Maximum files processed at once; defaults to `max(2, floor(cpus / 2))`. */
  concurrency?: number;
  /** Aborting stops new files from starting; files already in progress finish. */
  signal?: AbortSignal;
  /** Called after every file (done, failed or skipped) with the result and overall progress. */
  onResult?: (result: FileResult, completed: number, total: number) => void;
}

/** Default worker count from the design: `max(2, floor(cpus / 2))`. */
export function defaultConcurrency(): number {
  return Math.max(2, Math.floor(os.cpus().length / 2));
}

/** Turns an unknown error into a short message safe to show in the UI. */
function describeError(err: unknown): string {
  if (err instanceof WriteFolderError) return 'Cannot write to folder';
  const message = err instanceof Error ? err.message : String(err);
  return message.split('\n')[0];
}

/**
 * Processes a single image: load (EXIF/HEIC) → smart fit → encode → write beside the original.
 * Returns the created file path; throws on any failure.
 *
 * @example
 * const out = await processFile('/photos/a.heic', { canvas: { width: 1080, height: 1350 }, format: 'keep' });
 */
export async function processFile(file: string, options: Pick<BatchOptions, 'canvas' | 'format' | 'quality'>): Promise<string> {
  const image = await loadImage(file);
  try {
    const pipeline = await smartFit(image, options.canvas);
    const format = resolveFormat(file, options.format);
    const bytes = await encode(pipeline, format, options.quality);
    return await writeOutput(file, bytes, options.canvas, format.ext);
  } finally {
    await image.dispose();
  }
}

/**
 * Runs a batch with bounded concurrency. A failure on one file never stops the others; cancelling
 * through `options.signal` marks every not-yet-started file as "skipped" and keeps finished outputs.
 *
 * @example
 * const controller = new AbortController();
 * const summary = await runBatch(files, {
 *   canvas: { width: 1080, height: 1350 },
 *   format: 'jpeg',
 *   quality: 90,
 *   signal: controller.signal,
 *   onResult: (r, done, total) => console.log(`${done}/${total}`, r.status),
 * });
 */
export async function runBatch(files: string[], options: BatchOptions): Promise<BatchSummary> {
  const workers = Math.max(1, Math.min(options.concurrency ?? defaultConcurrency(), files.length || 1));
  // Share libvips threads between workers so parallel files do not oversubscribe the CPU.
  sharp.concurrency(Math.max(1, Math.floor(os.cpus().length / workers)));

  const results: FileResult[] = new Array(files.length);
  let next = 0;
  let completed = 0;

  const record = (index: number, result: FileResult): void => {
    results[index] = result;
    completed++;
    options.onResult?.(result, completed, files.length);
  };

  async function worker(): Promise<void> {
    while (next < files.length) {
      const index = next++;
      const file = files[index];
      if (options.signal?.aborted) {
        record(index, { file, status: 'skipped' });
        continue;
      }
      try {
        const output = await processFile(file, options);
        record(index, { file, status: 'done', output });
      } catch (err) {
        record(index, { file, status: 'failed', error: describeError(err) });
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));

  return {
    results,
    succeeded: results.filter((r) => r.status === 'done').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
  };
}
