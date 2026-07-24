import type { CanvasPreset, ClockCanvas } from "../model/types";

export const canvasPresets: Record<
  CanvasPreset,
  Pick<ClockCanvas, "width" | "height">
> = {
  square: { width: 400, height: 400 },
  landscape: { width: 600, height: 400 },
  portrait: { width: 400, height: 600 },
};
