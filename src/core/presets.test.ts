import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { PresetStore, PresetValidationError, validatePreset } from './presets';

describe('validatePreset', () => {
  const existing = [{ id: 'a', name: 'Story', width: 1080, height: 1920 }];

  it('accepts a valid preset', () => {
    expect(validatePreset({ name: 'Square', width: 1080, height: 1080 }, existing)).toEqual({});
  });

  it('rejects zero, fractional, huge and non-numeric sizes', () => {
    expect(validatePreset({ name: 'X', width: 0, height: 10 }, existing).width).toBeDefined();
    expect(validatePreset({ name: 'X', width: 10.5, height: 10 }, existing).width).toBeDefined();
    expect(validatePreset({ name: 'X', width: 10, height: 16385 }, existing).height).toBeDefined();
    expect(validatePreset({ name: 'X', width: NaN, height: 10 }, existing).width).toBeDefined();
    expect(validatePreset({ name: 'X', width: 16384, height: 1 }, existing)).toEqual({});
  });

  it('rejects empty and duplicate names but lets a preset keep its own name', () => {
    expect(validatePreset({ name: '  ', width: 1, height: 1 }, existing).name).toBeDefined();
    expect(validatePreset({ name: 'story', width: 1, height: 1 }, existing).name).toBeDefined();
    expect(validatePreset({ name: 'Story', width: 1, height: 1 }, existing, 'a')).toEqual({});
  });
});

describe('PresetStore', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'presets-'));
  });

  it('creates four defaults on first launch and selects the first', async () => {
    const store = await PresetStore.open(dir);
    expect(store.list().map((p) => [p.width, p.height])).toEqual([
      [1080, 1080],
      [1080, 1350],
      [1920, 1080],
      [1280, 720],
    ]);
    expect(store.selected()?.id).toBe(store.list()[0].id);
    expect(JSON.parse(await readFile(path.join(dir, 'presets.json'), 'utf8')).presets).toHaveLength(4);
  });

  it('round-trips added presets and the selection across reopen', async () => {
    const store = await PresetStore.open(dir);
    const added = await store.add({ name: 'Instagram Portrait', width: 1080, height: 1350 });
    await store.select(added.id);
    const reopened = await PresetStore.open(dir);
    expect(reopened.list().some((p) => p.name === 'Instagram Portrait')).toBe(true);
    expect(reopened.selected()?.id).toBe(added.id);
  });

  it('rejects invalid and duplicate input with field messages', async () => {
    const store = await PresetStore.open(dir);
    await expect(store.add({ name: 'A', width: 0, height: 10 })).rejects.toBeInstanceOf(PresetValidationError);
    await expect(store.add({ name: 'Square', width: 5, height: 5 })).rejects.toBeInstanceOf(PresetValidationError);
  });

  it('auto-selects another preset when the selected one is deleted, and none when empty', async () => {
    const store = await PresetStore.open(dir);
    const [first, second, ...rest] = store.list();
    await store.remove(first.id);
    expect(store.selected()?.id).toBe(second.id);
    for (const p of [second, ...rest]) await store.remove(p.id);
    expect(store.selected()).toBeNull();
    expect(store.list()).toEqual([]);
  });

  it('edits a preset in place', async () => {
    const store = await PresetStore.open(dir);
    const first = store.list()[0];
    await store.update(first.id, { name: 'Square', width: 1000, height: 1000 });
    expect((await PresetStore.open(dir)).list()[0]).toMatchObject({ name: 'Square', width: 1000 });
  });

  it('falls back to defaults when presets.json is corrupt', async () => {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(dir, 'presets.json'), '{not json');
    expect((await PresetStore.open(dir)).list()).toHaveLength(4);
  });
});
