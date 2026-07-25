import {
  ImageManipulator,
  SaveFormat,
  type ImageResult,
} from "expo-image-manipulator";

export const MAX_IMPORTED_IMAGE_DIMENSION = 4096;

const resolveFormat = (mimeType?: string | null) => {
  if (mimeType === "image/png") return SaveFormat.PNG;
  if (mimeType === "image/webp") return SaveFormat.WEBP;
  return SaveFormat.JPEG;
};

export const normalizePickedImage = async ({
  height,
  mimeType,
  uri,
  width,
}: {
  height: number;
  mimeType?: string | null;
  uri: string;
  width: number;
}): Promise<ImageResult> => {
  const context = ImageManipulator.manipulate(uri);
  const longestEdge = Math.max(width, height, 1);
  if (longestEdge > MAX_IMPORTED_IMAGE_DIMENSION) {
    const scale = MAX_IMPORTED_IMAGE_DIMENSION / longestEdge;
    context.resize({
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    });
  }

  const rendered = await context.renderAsync();
  try {
    return await rendered.saveAsync({
      compress: resolveFormat(mimeType) === SaveFormat.JPEG ? 0.95 : 1,
      format: resolveFormat(mimeType),
    });
  } finally {
    rendered.release();
    context.release();
  }
};
