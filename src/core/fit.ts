/** Width and height in pixels. */
export interface Size {
  width: number;
  height: number;
}

/** Placement of a scaled image: its size and top-left offset on the canvas. */
export interface Placement extends Size {
  left: number;
  top: number;
}

/** Geometry of a smart fit: the sharp foreground and the cover-scaled background. */
export interface FitGeometry {
  canvas: Size;
  /** The whole photo scaled to fit inside the canvas, centred. Never cropped. */
  foreground: Placement;
  /** The photo scaled to cover the whole canvas (cropped as needed), used for the blur. */
  background: Size;
  /** True when the foreground leaves visible margins (more than 1px) and a background is needed. */
  hasMargins: boolean;
}

/**
 * Computes how a photo of `source` size is fitted onto `canvas`.
 *
 * The foreground scale is the largest one at which the entire photo still fits (so the photo's
 * larger side, relative to the canvas, touches the canvas edge). Small sources are scaled up.
 *
 * @example
 * calculateFit({ width: 4000, height: 3000 }, { width: 1080, height: 1350 });
 * // foreground: { width: 1080, height: 810, left: 0, top: 270 }
 */
export function calculateFit(source: Size, canvas: Size): FitGeometry {
  const fitScale = Math.min(canvas.width / source.width, canvas.height / source.height);
  const coverScale = Math.max(canvas.width / source.width, canvas.height / source.height);

  // Rounding can overshoot the canvas by a pixel; clamp so the foreground always fits.
  const width = Math.min(canvas.width, Math.max(1, Math.round(source.width * fitScale)));
  const height = Math.min(canvas.height, Math.max(1, Math.round(source.height * fitScale)));
  const left = Math.floor((canvas.width - width) / 2);
  const top = Math.floor((canvas.height - height) / 2);

  const hasMargins = canvas.width - width > 1 || canvas.height - height > 1;
  return {
    canvas: { ...canvas },
    foreground: { width, height, left, top },
    background: {
      width: Math.max(canvas.width, Math.round(source.width * coverScale)),
      height: Math.max(canvas.height, Math.round(source.height * coverScale)),
    },
    hasMargins,
  };
}
