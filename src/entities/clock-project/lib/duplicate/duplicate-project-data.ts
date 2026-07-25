import type { ClockLayer } from "@/entities/clock-layer";
import type { ImageAsset } from "@/entities/image-asset";
import { createId } from "@/shared/lib/id";

import type { ClockProject } from "../../model/types";

export type DuplicateProjectIdMap = {
  projectId: { source: string; target: string };
  assetIds: Record<string, string>;
  layerIds: Record<string, string>;
};

export type DuplicateProjectFileMap = Record<string, string>;

export type DuplicateProjectData = {
  project: ClockProject;
  ids: DuplicateProjectIdMap;
};

const mappedUri = (
  uri: string | undefined,
  fileMap: DuplicateProjectFileMap,
) => (uri ? fileMap[uri] : undefined);

const mappedId = (ids: Record<string, string>, sourceId: string) => {
  const targetId = ids[sourceId];
  if (!targetId) throw new Error(`ID 매핑을 찾을 수 없어요: ${sourceId}`);
  return targetId;
};

export const duplicateProjectData = ({
  destinationId,
  fileMap,
  ids: existingIds,
  name,
  source,
}: {
  destinationId: string;
  fileMap: DuplicateProjectFileMap;
  ids?: DuplicateProjectIdMap;
  name: string;
  source: ClockProject;
}): DuplicateProjectData => {
  const assetIds =
    existingIds?.assetIds ??
    Object.fromEntries(
      source.assets.map((asset) => [asset.id, createId("asset")]),
    );
  const layerIds =
    existingIds?.layerIds ??
    Object.fromEntries(
      source.layers.map((layer) => [layer.id, createId("layer")]),
    );
  const now = new Date().toISOString();

  const assets: ImageAsset[] = source.assets.map((asset) => ({
    ...asset,
    id: mappedId(assetIds, asset.id),
    originalUri: mappedUri(asset.originalUri, fileMap) ?? asset.originalUri,
    processedUri: mappedUri(asset.processedUri, fileMap) ?? asset.processedUri,
    lassoPoints: asset.lassoPoints?.map((point) => ({ ...point })),
    lassoRegions: asset.lassoRegions?.map((region) =>
      region.map((point) => ({ ...point })),
    ),
    cropBounds: asset.cropBounds ? { ...asset.cropBounds } : undefined,
  }));

  const layers: ClockLayer[] = source.layers.map((layer) => ({
    ...layer,
    id: mappedId(layerIds, layer.id),
    imageAssetId: layer.imageAssetId
      ? mappedId(assetIds, layer.imageAssetId)
      : undefined,
    imageUri: mappedUri(layer.imageUri, fileMap) ?? layer.imageUri,
    transform: { ...layer.transform },
  }));

  return {
    ids: {
      projectId: existingIds?.projectId ?? {
        source: source.id,
        target: destinationId,
      },
      assetIds,
      layerIds,
    },
    project: {
      ...source,
      id: destinationId,
      name,
      canvas: {
        ...source.canvas,
        shadow: source.canvas.shadow ? { ...source.canvas.shadow } : undefined,
        backgroundImageUri: mappedUri(
          source.canvas.backgroundImageUri,
          fileMap,
        ),
        backgroundImageAssetId: source.canvas.backgroundImageAssetId
          ? assetIds[source.canvas.backgroundImageAssetId]
          : undefined,
      },
      layers,
      assets,
      analogConfig: source.analogConfig
        ? {
            ...source.analogConfig,
            hourHandLayerId: source.analogConfig.hourHandLayerId
              ? mappedId(layerIds, source.analogConfig.hourHandLayerId)
              : undefined,
            minuteHandLayerId: source.analogConfig.minuteHandLayerId
              ? mappedId(layerIds, source.analogConfig.minuteHandLayerId)
              : undefined,
          }
        : undefined,
      digitalConfig: source.digitalConfig
        ? {
            ...source.digitalConfig,
            digitImageMap: Object.fromEntries(
              Object.entries(source.digitalConfig.digitImageMap).map(
                ([digit, uri]) => [digit, uri ? fileMap[uri] : undefined],
              ),
            ),
            digitAssetMap: Object.fromEntries(
              Object.entries(source.digitalConfig.digitAssetMap).map(
                ([digit, assetId]) => [
                  digit,
                  assetId ? mappedId(assetIds, assetId) : undefined,
                ],
              ),
            ),
            transform: { ...source.digitalConfig.transform },
            slotTransforms: source.digitalConfig.slotTransforms
              ? Object.fromEntries(
                  Object.entries(source.digitalConfig.slotTransforms).map(
                    ([slotId, transform]) => [
                      slotId,
                      transform ? { ...transform } : transform,
                    ],
                  ),
                )
              : undefined,
          }
        : undefined,
      previewImageUri: mappedUri(source.previewImageUri, fileMap),
      createdAt: now,
      updatedAt: now,
    },
  };
};
