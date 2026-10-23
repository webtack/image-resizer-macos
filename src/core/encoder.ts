import * as path from 'node:path';
import type { Sharp } from 'sharp';
import type { OutputFormat } from '../shared/types';

export type { OutputFormat };

/** Concrete encoding chosen for one file. */
export interface ResolvedFormat {
  codec: 'jpeg' | 'png' | 'webp' | 'tiff';
  /** File extension without the dot. */
  ext: string;
}

/** Default JPEG quality (spec: 1–100, default 90). */
export const DEFAULT_QUALITY = 90;

/**
 * Decides the output codec for a source file.
 *
 * "keep" retains JPEG, PNG, WebP and TIFF sources in their own format and falls back to JPEG for
 * anything the app cannot write (for example HEIC).
 *
 * @example
 * resolveFormat('/p/a.heic', 'keep'); // { codec: 'jpeg', ext: 'jpg' }
 * resolveFormat('/p/a.png', 'jpeg'); // { codec: 'jpeg', ext: 'jpg' }
 */
export function resolveFormat(sourceFile: string, format: OutputFormat): ResolvedFormat {
  if (format === 'jpeg') return { codec: 'jpeg', ext: 'jpg' };
  if (format === 'png') return { codec: 'png', ext: 'png' };
  switch (path.extname(sourceFile).toLowerCase()) {
    case '.png':
      return { codec: 'png', ext: 'png' };
    case '.webp':
      return { codec: 'webp', ext: 'webp' };
    case '.tif':
    case '.tiff':
      return { codec: 'tiff', ext: 'tif' };
    default:
      return { codec: 'jpeg', ext: 'jpg' };
  }
}

/** Clamps a quality value into the allowed 1–100 range, falling back to the default. */
export function normalizeQuality(quality: number | undefined): number {
  if (quality === undefined || !Number.isFinite(quality)) return DEFAULT_QUALITY;
  return Math.min(100, Math.max(1, Math.round(quality)));
}

/**
 * Encodes a rendered pipeline into bytes with the resolved codec.
 *
 * @example
 * const bytes = await encode(pipeline, resolveFormat('a.png', 'jpeg'), 80);
 */
export async function encode(pipeline: Sharp, format: ResolvedFormat, quality?: number): Promise<Buffer> {
  const q = normalizeQuality(quality);
  switch (format.codec) {
    case 'jpeg':
      return pipeline.jpeg({ quality: q, mozjpeg: false }).toBuffer();
    case 'png':
      return pipeline.png().toBuffer();
    case 'webp':
      return pipeline.webp({ quality: q }).toBuffer();
    case 'tiff':
      return pipeline.tiff({ quality: q }).toBuffer();
  }
}
