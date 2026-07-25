import type { RefObject } from "react";
import { ImageFormat, makeImageFromView } from "@shopify/react-native-skia";
import type { View } from "react-native";

import {
  projectAssetRepository,
  type ClockProject,
} from "@/entities/clock-project";

export const updateProjectPreview = async (
  project: ClockProject,
  viewRef: RefObject<View | null>,
): Promise<string> => {
  if (!viewRef.current) {
    throw new Error("미리보기를 만들 시계 화면이 준비되지 않았어요.");
  }

  const image = await makeImageFromView(viewRef);
  if (!image) {
    throw new Error("시계 화면을 이미지로 변환하지 못했어요.");
  }
  const pngBytes = image.encodeToBytes(ImageFormat.PNG, 90);
  return projectAssetRepository.savePreview(
    project.id,
    pngBytes,
    project.previewImageUri,
  );
};
