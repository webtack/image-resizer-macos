/**
 * Plain data types shared by the core, the main process and the renderer.
 * This file must stay free of imports so the renderer can compile it without pulling in Node code.
 */

/** User-selectable output format. */
export type OutputFormat = 'keep' | 'jpeg' | 'png';

/**
 * A named target size.
 *
 * A side set to `null` is left open: it is calculated per image so the original proportions are kept.
 * At least one side is always set in a valid preset.
 */
export interface SizePreset {
  id: string;
  name: string;
  /** Target width in pixels, or `null` to derive it from the height. */
  width: number | null;
  /** Target height in pixels, or `null` to derive it from the width. */
  height: number | null;
}

/** User-editable fields of a preset (everything except the generated id). */
export type PresetInput = Pick<SizePreset, 'name' | 'width' | 'height'>;

/** Field-level validation messages; an empty object means the input is valid. */
export interface PresetErrors {
  name?: string;
  width?: string;
  height?: string;
}

/** Outcome of one file. "skipped" means the batch was cancelled before the file was processed. */
export interface FileResult {
  file: string;
  status: 'done' | 'failed' | 'skipped';
  /** Path of the created file when `status` is "done". */
  output?: string;
  /** Human-readable failure reason when `status` is "failed". */
  error?: string;
}

/** Summary counts of a finished batch. */
export interface BatchSummary {
  results: FileResult[];
  succeeded: number;
  failed: number;
  skipped: number;
}
