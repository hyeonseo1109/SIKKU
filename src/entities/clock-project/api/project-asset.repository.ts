import { Directory, File } from "expo-file-system";

import { createId } from "@/shared/lib/id";

import {
  ensureProjectDirectories,
  getProjectDirectory,
} from "./clock-project.paths";
import type { ProjectAssetRepository } from "./project-asset.repository.types";

const supportedExtensions = new Set(["png", "jpg", "jpeg", "webp"]);

const getExtension = (
  sourceUri: string,
  fileName?: string | null,
  mimeType?: string | null,
) => {
  const candidate = fileName ?? sourceUri.split("/").at(-1) ?? "";
  const extension = candidate.split(".").at(-1)?.toLowerCase();

  if (extension && supportedExtensions.has(extension)) {
    return extension;
  }

  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  return "jpg";
};

const safeDelete = (uri: string) => {
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
};

export const projectAssetRepository: ProjectAssetRepository = {
  async importImage({
    category,
    fileName,
    height,
    mimeType,
    projectId,
    sourceUri,
    width,
  }) {
    ensureProjectDirectories(projectId);
    const source = new File(sourceUri);

    if (!source.exists) {
      throw new Error("선택한 이미지 파일을 읽을 수 없어요.");
    }

    const id = createId("asset");
    const extension = getExtension(sourceUri, fileName, mimeType);
    const originals = new Directory(
      getProjectDirectory(projectId),
      "assets",
      "originals",
    );
    const original = new File(originals, `original-${id}.${extension}`);

    try {
      await source.copy(original);
      return {
        id,
        originalUri: original.uri,
        processedUri: original.uri,
        selectionMode: "full",
        width,
        height,
        category,
      };
    } catch (error: unknown) {
      console.error("[AssetRepository] Failed to import image", error);
      safeDelete(original.uri);
      throw new Error("이미지를 앱 저장소로 복사하지 못했어요.");
    }
  },

  async saveProcessedImage(projectId, asset, pngBytes, lassoPoints) {
    ensureProjectDirectories(projectId);
    const processedDirectory = new Directory(
      getProjectDirectory(projectId),
      "assets",
      "processed",
    );
    const result = new File(
      processedDirectory,
      `lasso-${asset.id}-${Date.now()}.png`,
    );

    try {
      result.create({ intermediates: true, overwrite: true });
      result.write(pngBytes);
      return {
        ...asset,
        processedUri: result.uri,
        selectionMode: "lasso",
        lassoPoints,
      };
    } catch (error: unknown) {
      console.error("[AssetRepository] Failed to save lasso PNG", error);
      safeDelete(result.uri);
      throw new Error("투명 PNG를 저장하지 못했어요.");
    }
  },

  async removeAsset(_projectId, asset) {
    safeDelete(asset.originalUri);
    if (asset.processedUri !== asset.originalUri) {
      safeDelete(asset.processedUri);
    }
  },

  async removeAllProjectAssets(projectId) {
    const assets = new Directory(getProjectDirectory(projectId), "assets");
    if (assets.exists) {
      assets.delete();
    }
  },
};
