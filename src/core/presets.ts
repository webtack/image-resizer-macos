import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { PresetErrors, PresetInput, SizePreset } from '../shared/types';

export type { PresetErrors, PresetInput, SizePreset };

/** Smallest and largest allowed canvas side, in pixels. */
export const MIN_SIDE = 1;
export const MAX_SIDE = 16384;

/** Persisted shape of `presets.json`. */
interface PresetFile {
  presets: SizePreset[];
  selectedId: string | null;
}

/** Presets created on first launch. */
const DEFAULT_PRESETS: PresetInput[] = [
  { name: 'Square', width: 1080, height: 1080 },
  { name: 'Portrait 4:5', width: 1080, height: 1350 },
  { name: 'Full HD 16:9', width: 1920, height: 1080 },
  { name: 'HD 16:9', width: 1280, height: 720 },
];

/** Checks that a value is an integer within the allowed side range. */
function isValidSide(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_SIDE && value <= MAX_SIDE;
}

/**
 * Validates preset input and returns per-field messages.
 *
 * Names must be non-empty and unique (case-insensitive) among `existing`; pass `ignoreId` when
 * editing so a preset does not clash with itself.
 *
 * @example
 * validatePreset({ name: 'Story', width: 0, height: 1920 }, existing);
 * // { width: 'Width must be a whole number from 1 to 16384' }
 */
export function validatePreset(input: PresetInput, existing: SizePreset[], ignoreId?: string): PresetErrors {
  const errors: PresetErrors = {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name === '') {
    errors.name = 'Name must not be empty';
  } else if (existing.some((p) => p.id !== ignoreId && p.name.toLowerCase() === name.toLowerCase())) {
    errors.name = 'A preset with this name already exists';
  }
  if (!isValidSide(input.width)) errors.width = `Width must be a whole number from ${MIN_SIDE} to ${MAX_SIDE}`;
  if (!isValidSide(input.height)) errors.height = `Height must be a whole number from ${MIN_SIDE} to ${MAX_SIDE}`;
  return errors;
}

/** Thrown by {@link PresetStore} when input fails validation; carries the field messages. */
export class PresetValidationError extends Error {
  constructor(public readonly errors: PresetErrors) {
    super(Object.values(errors).join('; '));
    this.name = 'PresetValidationError';
  }
}

/**
 * Persists size presets and the selected preset id as JSON in a given directory.
 *
 * The directory is a constructor argument (not an Electron path) so tests can use a temp dir.
 *
 * @example
 * const store = await PresetStore.open(app.getPath('userData'));
 * await store.add({ name: 'Story', width: 1080, height: 1920 });
 * const selected = store.selected();
 */
export class PresetStore {
  private constructor(
    private readonly file: string,
    private data: PresetFile,
  ) {}

  /** Opens the store, creating the four default presets on first launch. */
  static async open(dir: string): Promise<PresetStore> {
    const file = path.join(dir, 'presets.json');
    let data: PresetFile | null = null;
    try {
      data = PresetStore.parse(JSON.parse(await fs.readFile(file, 'utf8')));
    } catch {
      // Missing or corrupt file: fall back to defaults below.
    }
    const store = new PresetStore(file, data ?? PresetStore.defaults());
    if (!data) await store.save();
    return store;
  }

  /** Builds the first-launch state: default presets with the first one selected. */
  private static defaults(): PresetFile {
    const presets = DEFAULT_PRESETS.map((p, i) => ({ id: `default-${i + 1}`, ...p }));
    return { presets, selectedId: presets[0].id };
  }

  /** Accepts only well-formed persisted data; returns null so the caller can reset to defaults. */
  private static parse(raw: unknown): PresetFile | null {
    const obj = raw as Partial<PresetFile> | null;
    if (!obj || !Array.isArray(obj.presets)) return null;
    const presets = obj.presets.filter(
      (p): p is SizePreset =>
        !!p && typeof p.id === 'string' && typeof p.name === 'string' && isValidSide(p.width) && isValidSide(p.height),
    );
    const selectedId = presets.some((p) => p.id === obj.selectedId) ? (obj.selectedId as string) : (presets[0]?.id ?? null);
    return { presets, selectedId };
  }

  /** Writes the state atomically (temp file + rename) so a crash cannot corrupt the presets. */
  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    await fs.rename(tmp, this.file);
  }

  /** All presets in display order. */
  list(): SizePreset[] {
    return this.data.presets.map((p) => ({ ...p }));
  }

  /** The currently selected preset, or null when the list is empty. */
  selected(): SizePreset | null {
    const p = this.data.presets.find((x) => x.id === this.data.selectedId);
    return p ? { ...p } : null;
  }

  /** Validates and appends a preset; throws {@link PresetValidationError} on invalid input. */
  async add(input: PresetInput): Promise<SizePreset> {
    this.assertValid(input);
    const preset: SizePreset = { id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, ...this.clean(input) };
    this.data.presets.push(preset);
    if (!this.data.selectedId) this.data.selectedId = preset.id;
    await this.save();
    return { ...preset };
  }

  /** Validates and updates an existing preset; throws if the id is unknown or input invalid. */
  async update(id: string, input: PresetInput): Promise<SizePreset> {
    const preset = this.data.presets.find((p) => p.id === id);
    if (!preset) throw new Error(`Unknown preset: ${id}`);
    this.assertValid(input, id);
    Object.assign(preset, this.clean(input));
    await this.save();
    return { ...preset };
  }

  /** Deletes a preset; when it was selected, selects the first remaining one (or none). */
  async remove(id: string): Promise<void> {
    this.data.presets = this.data.presets.filter((p) => p.id !== id);
    if (this.data.selectedId === id) this.data.selectedId = this.data.presets[0]?.id ?? null;
    await this.save();
  }

  /** Marks a preset as selected; throws if the id is unknown. */
  async select(id: string): Promise<void> {
    if (!this.data.presets.some((p) => p.id === id)) throw new Error(`Unknown preset: ${id}`);
    this.data.selectedId = id;
    await this.save();
  }

  private assertValid(input: PresetInput, ignoreId?: string): void {
    const errors = validatePreset(input, this.data.presets, ignoreId);
    if (Object.keys(errors).length > 0) throw new PresetValidationError(errors);
  }

  private clean(input: PresetInput): PresetInput {
    return { name: input.name.trim(), width: input.width, height: input.height };
  }
}
