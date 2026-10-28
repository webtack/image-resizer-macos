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

  it('accepts a width-only or height-only preset', () => {
    expect(validatePreset({ name: 'W', width: 1000, height: null }, existing)).toEqual({});
    expect(validatePreset({ name: 'H', width: null, height: 1350 }, existing)).toEqual({});
  });

  it('rejects a preset with both sides empty', () => {
    expect(validatePreset({ name: 'X', width: null, height: null }, existing).width).toBe('Enter a width, a height, or both');
  });

  it('still validates the filled side of a one-sided preset', () => {
    expect(validatePreset({ name: 'X', width: 0, height: null }, existing).width).toBeDefined();
    expect(validatePreset({ name: 'X', width: null, height: 20000 }, existing).height).toBeDefined();
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

  it('round-trips one-sided presets with null sides', async () => {
    const store = await PresetStore.open(dir);
    const w = await store.add({ name: 'Web 1200', width: 1200, height: null });
    const h = await store.add({ name: 'Tall 1350', width: null, height: 1350 });
    const reopened = await PresetStore.open(dir);
    expect(reopened.list().find((p) => p.id === w.id)).toMatchObject({ width: 1200, height: null });
    expect(reopened.list().find((p) => p.id === h.id)).toMatchObject({ width: null, height: 1350 });
  });

  it('loads a legacy file whose presets have numbers on both sides', async () => {
    const { writeFile } = await import('node:fs/promises');
    const legacy = { presets: [{ id: 'old', name: 'Old', width: 800, height: 600 }], selectedId: 'old' };
    await writeFile(path.join(dir, 'presets.json'), JSON.stringify(legacy));
    const store = await PresetStore.open(dir);
    expect(store.list()).toEqual(legacy.presets);
    expect(store.selected()?.id).toBe('old');
  });

  it('drops persisted presets with both sides null', async () => {
    const { writeFile } = await import('node:fs/promises');
    const file = { presets: [{ id: 'bad', name: 'Bad', width: null, height: null }], selectedId: 'bad' };
    await writeFile(path.join(dir, 'presets.json'), JSON.stringify(file));
    expect((await PresetStore.open(dir)).list()).toEqual([]);
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
