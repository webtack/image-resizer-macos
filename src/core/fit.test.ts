import { describe, expect, it } from 'vitest';
import { calculateFit, resolveCanvas } from './fit';

describe('calculateFit', () => {
  it('fits a landscape photo on a portrait canvas, centred vertically', () => {
    const g = calculateFit({ width: 4000, height: 3000 }, { width: 1080, height: 1350 });
    expect(g.foreground).toEqual({ width: 1080, height: 810, left: 0, top: 270 });
    expect(g.hasMargins).toBe(true);
  });

  it('produces no margins when the aspect ratio matches', () => {
    const g = calculateFit({ width: 2000, height: 2500 }, { width: 1080, height: 1350 });
    expect(g.foreground).toEqual({ width: 1080, height: 1350, left: 0, top: 0 });
    expect(g.hasMargins).toBe(false);
  });

  it('upscales a tiny source to fit', () => {
    const g = calculateFit({ width: 400, height: 300 }, { width: 1080, height: 1350 });
    expect(g.foreground.width).toBe(1080);
    expect(g.foreground.height).toBe(810);
  });

  it('covers the whole canvas with the background scale', () => {
    const g = calculateFit({ width: 4000, height: 3000 }, { width: 1080, height: 1350 });
    expect(g.background.height).toBe(1350);
    expect(g.background.width).toBeGreaterThanOrEqual(1080);
  });

  it('never lets the foreground exceed the canvas (panorama)', () => {
    const g = calculateFit({ width: 10000, height: 1000 }, { width: 1080, height: 1080 });
    expect(g.foreground.width).toBeLessThanOrEqual(1080);
    expect(g.foreground.left + g.foreground.width).toBeLessThanOrEqual(1080);
  });
});

describe('resolveCanvas', () => {
  it('derives the height from a width, keeping proportions', () => {
    expect(resolveCanvas({ width: 4000, height: 3000 }, { width: 1080, height: null })).toEqual({
      canvas: { width: 1080, height: 810 },
      proportional: true,
    });
  });

  it('derives the width from a height, rounding to the nearest pixel', () => {
    expect(resolveCanvas({ width: 3000, height: 4000 }, { width: null, height: 1350 }).canvas).toEqual({ width: 1013, height: 1350 });
    expect(resolveCanvas({ width: 3000, height: 4000 }, { width: 1000, height: null }).canvas).toEqual({ width: 1000, height: 1333 });
  });

  it('scales a small source up', () => {
    expect(resolveCanvas({ width: 400, height: 300 }, { width: 1080, height: null }).canvas).toEqual({ width: 1080, height: 810 });
  });

  it('clamps a computed side to 16384', () => {
    expect(resolveCanvas({ width: 20000, height: 100 }, { width: null, height: 1000 }).canvas).toEqual({ width: 16384, height: 1000 });
  });

  it('returns a two-sided target unchanged', () => {
    expect(resolveCanvas({ width: 4000, height: 3000 }, { width: 1080, height: 1350 })).toEqual({
      canvas: { width: 1080, height: 1350 },
      proportional: false,
    });
  });

  it('throws when both sides are open', () => {
    expect(() => resolveCanvas({ width: 10, height: 10 }, { width: null, height: null })).toThrow();
  });
});
