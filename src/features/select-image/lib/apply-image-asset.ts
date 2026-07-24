import type { ClockLayer } from "@/entities/clock-layer";
import { normalizeLayerOrder } from "@/entities/clock-layer";
import type { ClockProject } from "@/entities/clock-project";
import {
  getFarthestLassoPoint,
  getLassoBottomCenter,
  type ImageAsset,
} from "@/entities/image-asset";
import { createId } from "@/shared/lib/id";

import type { ImageTarget } from "../model/image-target";

const getDefaultSize = (
  project: ClockProject,
  asset: ImageAsset,
  isHand: boolean,
) => {
  const aspectRatio =
    asset.width > 0 && asset.height > 0 ? asset.width / asset.height : 1;
  const maxWidth = project.canvas.width * (isHand ? 0.22 : 0.4);
  const maxHeight = project.canvas.height * (isHand ? 0.42 : 0.4);
  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.max(width, 32), height: Math.max(height, 32) };
};

const withAsset = (
  project: ClockProject,
  asset: ImageAsset,
  replacedAssetId?: string,
) => ({
  ...project,
  assets: [
    ...project.assets.filter(
      (item) => item.id !== asset.id && item.id !== replacedAssetId,
    ),
    asset,
  ],
});

export const getReplacedAsset = (
  project: ClockProject,
  target: ImageTarget,
): ImageAsset | undefined => {
  if (target.kind === "background") {
    return project.assets.find(
      (asset) => asset.id === project.canvas.backgroundImageAssetId,
    );
  }

  if (target.kind === "digit") {
    const assetId = project.digitalConfig?.digitAssetMap[target.digit];
    return project.assets.find((asset) => asset.id === assetId);
  }

  if (
    target.kind === "hour-hand" ||
    target.kind === "minute-hand" ||
    target.kind === "layer-reedit"
  ) {
    const layerId =
      target.kind === "layer-reedit" ? target.layerId : target.replaceLayerId;
    const assetId = project.layers.find(
      (layer) => layer.id === layerId,
    )?.imageAssetId;
    return project.assets.find((asset) => asset.id === assetId);
  }

  return undefined;
};

export const applyImageAsset = (
  project: ClockProject,
  asset: ImageAsset,
  target: ImageTarget,
): ClockProject => {
  const replacedAsset = getReplacedAsset(project, target);
  let next = withAsset(project, asset, replacedAsset?.id);

  if (target.kind === "background") {
    return {
      ...next,
      canvas: {
        ...next.canvas,
        backgroundImageUri: asset.processedUri,
        backgroundImageAssetId: asset.id,
      },
    };
  }

  if (target.kind === "digit") {
    if (!next.digitalConfig) {
      return next;
    }
    return {
      ...next,
      digitalConfig: {
        ...next.digitalConfig,
        digitImageMap: {
          ...next.digitalConfig.digitImageMap,
          [target.digit]: asset.processedUri,
        },
        digitAssetMap: {
          ...next.digitalConfig.digitAssetMap,
          [target.digit]: asset.id,
        },
      },
    };
  }

  const replaceLayerId =
    target.kind === "layer-reedit"
      ? target.layerId
      : target.kind === "hour-hand" || target.kind === "minute-hand"
        ? target.replaceLayerId
        : undefined;
  const existingLayer = next.layers.find(
    (layer) => layer.id === replaceLayerId,
  );

  if (existingLayer) {
    const isHand =
      existingLayer.type === "hour-hand" ||
      existingLayer.type === "minute-hand";
    const aspectRatio =
      asset.width > 0 && asset.height > 0 ? asset.width / asset.height : 1;
    const majorSize = Math.max(
      existingLayer.transform.width,
      existingLayer.transform.height,
    );
    const replacementSize =
      aspectRatio >= 1
        ? { width: majorSize, height: majorSize / aspectRatio }
        : { width: majorSize * aspectRatio, height: majorSize };
    const lassoAnchor = isHand ? getLassoBottomCenter(asset) : null;
    const pivot = lassoAnchor ?? {
      x: existingLayer.transform.anchorX,
      y: existingLayer.transform.anchorY,
    };
    const lassoTip = lassoAnchor ? getFarthestLassoPoint(asset, pivot) : null;

    return {
      ...next,
      layers: next.layers.map((layer) =>
        layer.id === existingLayer.id
          ? {
              ...layer,
              imageUri: asset.processedUri,
              imageAssetId: asset.id,
              transform: {
                ...layer.transform,
                width: replacementSize.width,
                height: replacementSize.height,
                anchorX: pivot.x,
                anchorY: pivot.y,
                tipX: isHand
                  ? (lassoTip?.x ?? layer.transform.tipX)
                  : layer.transform.tipX,
                tipY: isHand
                  ? (lassoTip?.y ?? layer.transform.tipY)
                  : layer.transform.tipY,
              },
            }
          : layer,
      ),
    };
  }

  const isHand = target.kind === "hour-hand" || target.kind === "minute-hand";
  const size = getDefaultSize(next, asset, isHand);
  const lassoAnchor = isHand ? getLassoBottomCenter(asset) : null;
  const pivot = lassoAnchor ?? { x: 0.5, y: isHand ? 1 : 0.5 };
  const lassoTip = isHand ? getFarthestLassoPoint(asset, pivot) : null;
  const centerX =
    isHand && next.analogConfig
      ? next.analogConfig.centerX
      : next.canvas.width / 2;
  const centerY =
    isHand && next.analogConfig
      ? next.analogConfig.centerY
      : next.canvas.height / 2;
  const type =
    target.kind === "hour-hand" || target.kind === "minute-hand"
      ? target.kind
      : "decoration";
  const layer: ClockLayer = {
    id: createId("layer"),
    name:
      type === "hour-hand"
        ? "시침"
        : type === "minute-hand"
          ? "분침"
          : `장식 ${next.layers.length + 1}`,
    type,
    imageUri: asset.processedUri,
    imageAssetId: asset.id,
    transform: {
      x: centerX,
      y: centerY,
      width: size.width,
      height: size.height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      anchorX: pivot.x,
      anchorY: pivot.y,
      tipX: isHand ? (lassoTip?.x ?? 0.5) : undefined,
      tipY: isHand ? (lassoTip?.y ?? 0) : undefined,
    },
    zIndex: next.layers.length,
    visible: true,
    locked: false,
    opacity: 1,
  };

  next = {
    ...next,
    layers: normalizeLayerOrder([...next.layers, layer]),
  };

  if (next.analogConfig && type === "hour-hand") {
    next = {
      ...next,
      analogConfig: {
        ...next.analogConfig,
        hourHandLayerId: layer.id,
      },
    };
  }
  if (next.analogConfig && type === "minute-hand") {
    next = {
      ...next,
      analogConfig: {
        ...next.analogConfig,
        minuteHandLayerId: layer.id,
      },
    };
  }

  return next;
};
