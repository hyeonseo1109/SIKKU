export type ImageSelectionMode = "full" | "lasso" | "auto";

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type NormalizedBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type ProjectAssetCategory =
  "background" | "decoration" | "hands" | "digits";

export type ImageAsset = {
  id: string;
  originalUri: string;
  processedUri: string;
  selectionMode: ImageSelectionMode;
  lassoPoints?: NormalizedPoint[];
  lassoRegions?: NormalizedPoint[][];
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  cropBounds?: NormalizedBounds;
  category: ProjectAssetCategory;
};
