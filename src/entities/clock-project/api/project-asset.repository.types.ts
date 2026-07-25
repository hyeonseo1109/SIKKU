import type {
  ImageAsset,
  ImageSelectionMode,
  NormalizedPoint,
  ProjectAssetCategory,
} from "@/entities/image-asset";

export type ImportImageParams = {
  projectId: string;
  sourceUri: string;
  category: ProjectAssetCategory;
  width: number;
  height: number;
  fileName?: string | null;
  mimeType?: string | null;
};

export type ProjectAssetRepository = {
  importImage: (params: ImportImageParams) => Promise<ImageAsset>;
  saveProcessedImage: (
    projectId: string,
    asset: ImageAsset,
    pngBytes: Uint8Array,
    lassoRegions: NormalizedPoint[][],
    selectionMode?: ImageSelectionMode,
  ) => Promise<ImageAsset>;
  savePreview: (
    projectId: string,
    pngBytes: Uint8Array,
    previousUri?: string,
  ) => Promise<string>;
  removeAsset: (projectId: string, asset: ImageAsset) => Promise<void>;
  removeAllProjectAssets: (projectId: string) => Promise<void>;
};
