import type { ClockLayerTransform } from "@/entities/clock-layer";

import { clamp } from "./clamp";

export const normalizeRotation = (rotation: number): number => {
  const normalized = ((rotation % 360) + 360) % 360;
  const snapTargets = [0, 90, 180, 270, 360];
  const snap = snapTargets.find((target) => Math.abs(normalized - target) <= 4);
  return snap === 360 ? 0 : (snap ?? normalized);
};

export const clampLayerToCanvas = (
  transform: ClockLayerTransform,
  canvasWidth: number,
  canvasHeight: number,
): ClockLayerTransform => {
  const visibleX = Math.min(transform.width * 0.2, 32);
  const visibleY = Math.min(transform.height * 0.2, 32);

  return {
    ...transform,
    x: clamp(
      transform.x,
      -transform.width / 2 + visibleX,
      canvasWidth + transform.width / 2 - visibleX,
    ),
    y: clamp(
      transform.y,
      -transform.height / 2 + visibleY,
      canvasHeight + transform.height / 2 - visibleY,
    ),
    width: clamp(transform.width, 24, canvasWidth * 2),
    height: clamp(transform.height, 24, canvasHeight * 2),
    rotation: normalizeRotation(transform.rotation),
    anchorX: clamp(transform.anchorX, 0, 1),
    anchorY: clamp(transform.anchorY, 0, 1),
  };
};
