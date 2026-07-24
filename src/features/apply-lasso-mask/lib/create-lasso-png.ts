import {
  ClipOp,
  ImageFormat,
  PathOp,
  Skia,
  rect,
  type SkPath,
} from "@shopify/react-native-skia";
import { File } from "expo-file-system";

import type {
  ImageAsset,
  NormalizedBounds,
  NormalizedPoint,
} from "@/entities/image-asset";
import { isValidPolygon } from "@/shared/lib/geometry";

const MAX_OUTPUT_DIMENSION = 2048;

export type CroppedPngResult = {
  bytes: Uint8Array;
  width: number;
  height: number;
  cropBounds: NormalizedBounds;
};

export const createLassoPng = async (
  asset: ImageAsset,
  regions: NormalizedPoint[][],
): Promise<CroppedPngResult> => {
  const validRegions = regions.filter(isValidPolygon);
  if (validRegions.length === 0) {
    throw new Error("선택 영역을 조금 더 크게 그려주세요.");
  }

  const originalFile = new File(asset.originalUri);
  if (!originalFile.exists) {
    throw new Error("원본 이미지를 찾을 수 없어요.");
  }

  const data = Skia.Data.fromBytes(await originalFile.bytes());
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) {
    throw new Error("이미지를 읽을 수 없어요.");
  }

  const sourceWidth = image.width();
  const sourceHeight = image.height();
  const cropBounds = validRegions.flat().reduce<NormalizedBounds>(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: 1, minY: 1, maxX: 0, maxY: 0 },
  );
  const cropWidth = Math.max(
    1,
    (cropBounds.maxX - cropBounds.minX) * sourceWidth,
  );
  const cropHeight = Math.max(
    1,
    (cropBounds.maxY - cropBounds.minY) * sourceHeight,
  );
  const outputScale = Math.min(
    1,
    MAX_OUTPUT_DIMENSION / Math.max(cropWidth, cropHeight),
  );
  const outputWidth = Math.max(1, Math.round(cropWidth * outputScale));
  const outputHeight = Math.max(1, Math.round(cropHeight * outputScale));
  const surface = Skia.Surface.MakeOffscreen(outputWidth, outputHeight);

  if (!surface) {
    throw new Error("투명 이미지를 만들 준비를 하지 못했어요.");
  }

  let path: SkPath | null = null;
  validRegions.forEach((points) => {
    const first = points[0];
    if (!first) return;
    const regionPath = Skia.Path.Make();
    const toOutputX = (x: number) =>
      ((x - cropBounds.minX) / (cropBounds.maxX - cropBounds.minX)) *
      outputWidth;
    const toOutputY = (y: number) =>
      ((y - cropBounds.minY) / (cropBounds.maxY - cropBounds.minY)) *
      outputHeight;
    regionPath.moveTo(toOutputX(first.x), toOutputY(first.y));
    points.slice(1).forEach((point) => {
      regionPath.lineTo(toOutputX(point.x), toOutputY(point.y));
    });
    regionPath.close();
    path = path
      ? (Skia.Path.MakeFromOp(path, regionPath, PathOp.Union) ?? path)
      : regionPath;
  });
  if (!path) throw new Error("올가미 경로가 비어 있어요.");

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color("transparent"));
  canvas.clipPath(path, ClipOp.Intersect, true);
  canvas.drawImageRect(
    image,
    rect(
      cropBounds.minX * sourceWidth,
      cropBounds.minY * sourceHeight,
      cropWidth,
      cropHeight,
    ),
    rect(0, 0, outputWidth, outputHeight),
    Skia.Paint(),
  );
  surface.flush();

  return {
    bytes: surface.makeImageSnapshot().encodeToBytes(ImageFormat.PNG, 100),
    width: outputWidth,
    height: outputHeight,
    cropBounds,
  };
};
