import type { ImageAsset, NormalizedPoint } from "../model/types";

export const getLassoBottomCenter = (
  asset: ImageAsset,
): NormalizedPoint | null => {
  if (asset.selectionMode !== "lasso" || !asset.lassoPoints?.length) {
    return null;
  }

  const bounds = asset.lassoPoints.reduce(
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
