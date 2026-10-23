import type { BatchSummary, FileResult, OutputFormat, PresetErrors, PresetInput, SizePreset } from './types';

export type { FileResult, BatchSummary, OutputFormat, PresetErrors, PresetInput, SizePreset };

/** Presets plus the selected id, as shown in the UI. */
export interface PresetState {
  presets: SizePreset[];
  selectedId: string | null;
}

/** Result of a preset mutation: the new state, or per-field validation messages. */
export type PresetResult = { ok: true; state: PresetState } | { ok: false; errors: PresetErrors };

/** Images found in the selected folder. Paths are relative to `folder` for display. */
export interface ImageListing {
  folder: string;
  files: string[];
}

/** Options for scanning and running; the selected preset is taken from the preset store. */
export interface RunOptions {
  recursive: boolean;
  format: OutputFormat;
  quality: number;
  /** Where results from subfolders go; only matters when `recursive` is on. */
  outputMode: 'each' | 'single';
}

/**
 * The narrow API the preload script exposes to the renderer as `window.resizer`.
 * The renderer never receives file paths to read or write: the main process only works inside
 * the folder the user picked or dropped.
 *
 * @example
 * const folder = await window.resizer.pickFolder();
 */
export interface ResizerApi {
  /** Opens the macOS folder picker; resolves to the chosen folder or null when cancelled. */
  pickFolder(): Promise<string | null>;
  /** Treats a dropped folder as the selected one; resolves to false if the path is not a folder. */
  selectDroppedFolder(file: File): Promise<string | null>;
  /** Lists supported images in the selected folder (excluding previous outputs of the selected preset). */
  listImages(recursive: boolean): Promise<ImageListing>;
  presets: {
    get(): Promise<PresetState>;
    add(input: PresetInput): Promise<PresetResult>;
    update(id: string, input: PresetInput): Promise<PresetResult>;
    remove(id: string): Promise<PresetState>;
    select(id: string): Promise<PresetState>;
  };
  /** Starts a batch over the selected folder; resolves with the summary when finished or cancelled. */
  run(options: RunOptions): Promise<BatchSummary>;
  /** Cancels the running batch after the current files finish. */
  cancel(): Promise<void>;
  /** Subscribes to per-file results; returns an unsubscribe function. */
  onResult(callback: (result: FileResult, completed: number, total: number) => void): () => void;
}
