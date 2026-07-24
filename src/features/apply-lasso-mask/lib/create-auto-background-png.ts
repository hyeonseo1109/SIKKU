import {
  AlphaType,
  ColorType,
  ImageFormat,
  Skia,
  rect,
} from "@shopify/react-native-skia";
import { File } from "expo-file-system";

import type { ImageAsset } from "@/entities/image-asset";

const MAX_AUTO_DIMENSION = 1024;
const COLOR_THRESHOLD = 64;

export const createAutoBackgroundPng = async (
  asset: ImageAsset,
): Promise<Uint8Array> => {
  const file = new File(asset.originalUri);
  if (!file.exists) throw new Error("원본 이미지를 찾을 수 없어요.");
  return createAutoBackgroundPngFromBytes(await file.bytes());
};

export const createAutoBackgroundPngFromBytes = (
  bytes: Uint8Array,
): Uint8Array => {
  const image = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(bytes));
  if (!image) throw new Error("이미지를 읽을 수 없어요.");

  const scale = Math.min(
    1,
    MAX_AUTO_DIMENSION / Math.max(image.width(), image.height()),
  );
  const width = Math.max(1, Math.round(image.width() * scale));
  const height = Math.max(1, Math.round(image.height() * scale));
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error("배경 제거를 시작하지 못했어요.");

  surface
    .getCanvas()
    .drawImageRect(
      image,
      rect(0, 0, image.width(), image.height()),
      rect(0, 0, width, height),
      Skia.Paint(),
    );
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  const info = {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  };
  const read = snapshot.readPixels(0, 0, info);
  if (!(read instanceof Uint8Array)) {
    throw new Error("이미지 색상 정보를 읽지 못했어요.");
  }

  const pixels = new Uint8Array(read);
  const edgeBand = Math.max(
    1,
    Math.min(16, Math.floor(Math.min(width, height) / 10)),
  );
  const colorBuckets = new Map<
    number,
    { count: number; r: number; g: number; b: number }
  >();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (
        x >= edgeBand &&
        x < width - edgeBand &&
        y >= edgeBand &&
        y < height - edgeBand
      ) {
        continue;
      }
      const offset = (y * width + x) * 4;
      if ((pixels[offset + 3] ?? 0) < 128) continue;
      const r = pixels[offset] ?? 0;
      const g = pixels[offset + 1] ?? 0;
      const b = pixels[offset + 2] ?? 0;
      const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
      const bucket = colorBuckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      colorBuckets.set(key, bucket);
    }
  }
  const dominant = [...colorBuckets.values()].reduce<
    { count: number; r: number; g: number; b: number } | undefined
  >(
    (largest, bucket) =>
      !largest || bucket.count > largest.count ? bucket : largest,
    undefined,
  );
  if (!dominant) {
    return snapshot.encodeToBytes(ImageFormat.PNG, 100);
  }
  const background = {
    r: dominant.r / dominant.count,
    g: dominant.g / dominant.count,
    b: dominant.b / dominant.count,
  };
  const similarToBackground = (pixelIndex: number) => {
    const offset = pixelIndex * 4;
    if ((pixels[offset + 3] ?? 0) < 16) return false;
    const dr = (pixels[offset] ?? 0) - background.r;
    const dg = (pixels[offset + 1] ?? 0) - background.g;
    const db = (pixels[offset + 2] ?? 0) - background.b;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= COLOR_THRESHOLD;
  };

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (index: number) => {
    if (visited[index] || !similarToBackground(index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (
        x < edgeBand ||
        x >= width - edgeBand ||
        y < edgeBand ||
        y >= height - edgeBand
      ) {
        enqueue(y * width + x);
      }
    }
  }
  while (head < tail) {
    const index = queue[head++]!;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) pixels[index * 4 + 3] = 0;
  }

  const result = Skia.Image.MakeImage(
    info,
    Skia.Data.fromBytes(pixels),
    width * 4,
  );
  if (!result) throw new Error("투명 이미지를 만들지 못했어요.");
  return result.encodeToBytes(ImageFormat.PNG, 100);
};
