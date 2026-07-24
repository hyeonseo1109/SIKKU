import type { ImageAsset, NormalizedPoint } from "../model/types";

const getProcessedPoints = (asset: ImageAsset): NormalizedPoint[] => {
  const points = asset.lassoRegions?.flat() ?? asset.lassoPoints ?? [];
  const bounds = asset.cropBounds;
  if (!bounds) return points;
  const width = Math.max(bounds.maxX - bounds.minX, 0.0001);
  const height = Math.max(bounds.maxY - bounds.minY, 0.0001);
  return points.map((point) => ({
    x: (point.x - bounds.minX) / width,
    y: (point.y - bounds.minY) / height,
  }));
};

export const getLassoBottomCenter = (
  asset: ImageAsset,
): NormalizedPoint | null => {
  const points = getProcessedPoints(asset);
  if (!points.length) {
    return null;
  }

  const bounds = points.reduce(
    (result, point) => ({
      minX: Math.min(result.minX, point.x),
      maxX: Math.max(result.maxX, point.x),
      maxY: Math.max(result.maxY, point.y),
    }),
    { minX: 1, maxX: 0, maxY: 0 },
  );

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: bounds.maxY,
  };
};

export const getFarthestLassoPoint = (
  asset: ImageAsset,
  origin: NormalizedPoint,
): NormalizedPoint | null => {
  const points = getProcessedPoints(asset);
  if (!points.length) {
    return null;
  }

  return points.reduce<NormalizedPoint | null>((farthest, point) => {
    if (!farthest) return point;
    const distance = (point.x - origin.x) ** 2 + (point.y - origin.y) ** 2;
    const farthestDistance =
      (farthest.x - origin.x) ** 2 + (farthest.y - origin.y) ** 2;
    return distance > farthestDistance ? point : farthest;
  }, null);
};
