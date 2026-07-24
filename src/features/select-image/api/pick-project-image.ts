import * as ImagePicker from "expo-image-picker";

import {
  projectAssetRepository,
  type ClockProject,
} from "@/entities/clock-project";
import type { ProjectAssetCategory } from "@/entities/image-asset";

export type PickProjectImageResult =
  | { status: "canceled" }
  | {
      status: "selected";
      asset: Awaited<ReturnType<typeof projectAssetRepository.importImage>>;
    };

export const pickProjectImage = async (
  project: ClockProject,
  category: ProjectAssetCategory,
): Promise<PickProjectImageResult> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    exif: false,
  });

  if (result.canceled) {
    return { status: "canceled" };
  }

  const selected = result.assets[0];
  if (!selected) {
    return { status: "canceled" };
  }

  const asset = await projectAssetRepository.importImage({
    projectId: project.id,
    sourceUri: selected.uri,
    category,
    width: selected.width || 1,
    height: selected.height || 1,
    fileName: selected.fileName,
    mimeType: selected.mimeType,
  });

  return { status: "selected", asset };
};
