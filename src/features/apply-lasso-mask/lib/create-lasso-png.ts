import { ClipOp, ImageFormat, Skia, rect } from "@shopify/react-native-skia";
import { File } from "expo-file-system";

import type { ImageAsset, NormalizedPoint } from "@/entities/image-asset";
import { isValidPolygon } from "@/shared/lib/geometry";

const MAX_OUTPUT_DIMENSION = 2048;

export const createLassoPng = async (
  asset: ImageAsset,
  points: NormalizedPoint[],
): Promise<Uint8Array> => {
  if (!isValidPolygon(points)) {
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
  const outputScale = Math.min(
    1,
    MAX_OUTPUT_DIMENSION / Math.max(sourceWidth, sourceHeight),
  );
  const outputWidth = Math.max(1, Math.round(sourceWidth * outputScale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * outputScale));
  const surface = Skia.Surface.MakeOffscreen(outputWidth, outputHeight);

  if (!surface) {
    throw new Error("투명 이미지를 만들 준비를 하지 못했어요.");
  }

  const path = Skia.Path.Make();
  const first = points[0];
  if (!first) {
    throw new Error("올가미 경로가 비어 있어요.");
  }

  path.moveTo(first.x * outputWidth, first.y * outputHeight);
  points.slice(1).forEach((point) => {
    path.lineTo(point.x * outputWidth, point.y * outputHeight);
  });
  path.close();

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color("transparent"));
  canvas.clipPath(path, ClipOp.Intersect, true);
  canvas.drawImageRect(
    image,
    rect(0, 0, sourceWidth, sourceHeight),
    rect(0, 0, outputWidth, outputHeight),
    Skia.Paint(),
  );
  surface.flush();

  return surface.makeImageSnapshot().encodeToBytes(ImageFormat.PNG, 100);
};
