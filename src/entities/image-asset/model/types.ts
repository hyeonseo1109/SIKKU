export type ImageSelectionMode = "full" | "lasso";

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type ProjectAssetCategory =
  "background" | "decoration" | "hands" | "digits";

export type ImageAsset = {
  id: string;
  originalUri: string;
  processedUri: string;
  selectionMode: ImageSelectionMode;
  lassoPoints?: NormalizedPoint[];
  width: number;
  height: number;
  category: ProjectAssetCategory;
};
