import type { NormalizedPoint } from "@/entities/image-asset";

import { clamp } from "./clamp";

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export const logicalToScreenPoint = (point: Point, scale: number): Point => ({
  x: point.x * scale,
  y: point.y * scale,
});

export const screenToLogicalPoint = (point: Point, scale: number): Point => ({
  x: point.x / scale,
  y: point.y / scale,
});

export const logicalToScreenSize = (size: Size, scale: number): Size => ({
  width: size.width * scale,
  height: size.height * scale,
});

export const screenToLogicalSize = (size: Size, scale: number): Size => ({
  width: size.width / scale,
  height: size.height / scale,
});

export const screenPointToNormalizedImagePoint = (
  point: Point,
  imageRect: Point & Size,
): NormalizedPoint => ({
  x: clamp((point.x - imageRect.x) / imageRect.width, 0, 1),
  y: clamp((point.y - imageRect.y) / imageRect.height, 0, 1),
});

export const normalizedImagePointToScreenPoint = (
  point: NormalizedPoint,
  imageRect: Point & Size,
): Point => ({
  x: imageRect.x + point.x * imageRect.width,
  y: imageRect.y + point.y * imageRect.height,
});
