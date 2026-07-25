import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";

import {
  projectAssetRepository,
  type ClockProject,
} from "@/entities/clock-project";
import type { ProjectAssetCategory } from "@/entities/image-asset";

import { normalizePickedImage } from "../lib/normalize-picked-image";

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

  const normalized = await normalizePickedImage({
    uri: selected.uri,
    width: selected.width || 1,
    height: selected.height || 1,
    mimeType: selected.mimeType,
  });
  let asset;
  try {
    asset = await projectAssetRepository.importImage({
      projectId: project.id,
      sourceUri: normalized.uri,
      category,
      width: normalized.width || 1,
      height: normalized.height || 1,
      fileName: null,
      mimeType: selected.mimeType,
    });
  } finally {
    const normalizedFile = new File(normalized.uri);
    if (normalizedFile.exists) normalizedFile.delete();
  }

  return { status: "selected", asset };
};
