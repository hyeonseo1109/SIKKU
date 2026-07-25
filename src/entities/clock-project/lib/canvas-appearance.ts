import type { ClockCanvas, ClockCanvasShadow } from "../model/types";

export const DEFAULT_CANVAS_CORNER_RADIUS = 24;
export const DEFAULT_CANVAS_SHADOW: ClockCanvasShadow = {
  enabled: false,
  color: "#214E49",
  opacity: 0.18,
  blur: 18,
  offsetY: 8,
};

export const resolveCanvasCornerRadius = (canvas: ClockCanvas): number =>
  Math.max(0, canvas.cornerRadius ?? DEFAULT_CANVAS_CORNER_RADIUS);

export const resolveCanvasShadow = (
  canvas: ClockCanvas,
): ClockCanvasShadow => ({
  ...DEFAULT_CANVAS_SHADOW,
  ...canvas.shadow,
});
