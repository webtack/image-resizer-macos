import { describe, expect, it } from 'vitest';
import { calculateFit } from './fit';

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
