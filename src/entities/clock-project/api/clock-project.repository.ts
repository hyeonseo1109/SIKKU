import { Directory, File } from "expo-file-system";

import type { ClockLayer } from "@/entities/clock-layer";
import type { ImageAsset } from "@/entities/image-asset";
import { storage } from "@/shared/storage";
import { createId } from "@/shared/lib/id";

import { migrateClockProject } from "../lib/migrations";
import type { ClockProject, ProjectIndexItem } from "../model/types";
import {
  ensureProjectDirectories,
  getProjectDirectory,
  getProjectFile,
  getProjectsDirectory,
} from "./clock-project.paths";
import type { ClockProjectRepository } from "./clock-project.repository.types";

const PROJECT_INDEX_KEY = "sikku.project-index.v1";

const toIndexItem = (project: ClockProject): ProjectIndexItem => ({
  id: project.id,
  name: project.name,
  type: project.type,
  previewImageUri: project.previewImageUri,
  updatedAt: project.updatedAt,
});

const getIndex = async (): Promise<ProjectIndexItem[]> => {
  try {
    return (await storage.getItem<ProjectIndexItem[]>(PROJECT_INDEX_KEY)) ?? [];
  } catch (error: unknown) {
    console.error("[ProjectRepository] Failed to read project index", error);
    return [];
  }
};

const setIndex = async (items: ProjectIndexItem[]) => {
  await storage.setItem(PROJECT_INDEX_KEY, items);
};

const upsertIndexItem = async (project: ClockProject) => {
  const current = await getIndex();
  const next = [
    toIndexItem(project),
    ...current.filter((item) => item.id !== project.id),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  await setIndex(next);
};

const writeProject = async (project: ClockProject) => {
  ensureProjectDirectories(project.id);
  const file = getProjectFile(project.id);
  file.create({ intermediates: true, overwrite: true });
  file.write(JSON.stringify(project, null, 2));
};

const copyDirectoryContents = async (
  source: Directory,
  destination: Directory,
) => {
  destination.create({ idempotent: true, intermediates: true });

  for (const entry of source.list()) {
    if (entry instanceof Directory) {
      await copyDirectoryContents(
        entry,
        new Directory(destination, entry.name),
      );
    } else {
      await entry.copy(new File(destination, entry.name), { overwrite: true });
    }
  }
};

const replaceProjectUri = (
  uri: string | undefined,
  sourceRoot: string,
  destinationRoot: string,
): string | undefined => {
  return uri?.replace(sourceRoot, destinationRoot);
};

const duplicateData = (
  source: ClockProject,
  destinationId: string,
  destinationRoot: string,
): ClockProject => {
  const now = new Date().toISOString();
  const sourceRoot = getProjectDirectory(source.id).uri;
  const assetIdMap = new Map<string, string>();
  const layerIdMap = new Map<string, string>();

  const assets: ImageAsset[] = source.assets.map((asset) => {
    const id = createId("asset");
    assetIdMap.set(asset.id, id);
    return {
      ...asset,
      id,
      originalUri:
        replaceProjectUri(asset.originalUri, sourceRoot, destinationRoot) ??
        asset.originalUri,
      processedUri:
        replaceProjectUri(asset.processedUri, sourceRoot, destinationRoot) ??
        asset.processedUri,
      lassoPoints: asset.lassoPoints?.map((point) => ({ ...point })),
    };
  });

  const layers: ClockLayer[] = source.layers.map((layer) => {
    const id = createId("layer");
    layerIdMap.set(layer.id, id);
    return {
      ...layer,
      id,
      imageAssetId: layer.imageAssetId
        ? assetIdMap.get(layer.imageAssetId)
        : undefined,
      imageUri:
        replaceProjectUri(layer.imageUri, sourceRoot, destinationRoot) ??
        layer.imageUri,
      transform: { ...layer.transform },
    };
  });

  const digitImageMap = source.digitalConfig
    ? Object.fromEntries(
        Object.entries(source.digitalConfig.digitImageMap).map(
          ([digit, uri]) => [
            digit,
            replaceProjectUri(uri, sourceRoot, destinationRoot),
          ],
        ),
      )
    : undefined;

  const digitAssetMap = source.digitalConfig
    ? Object.fromEntries(
        Object.entries(source.digitalConfig.digitAssetMap).map(
          ([digit, assetId]) => [
            digit,
            assetId ? assetIdMap.get(assetId) : undefined,
          ],
        ),
      )
    : undefined;

  return {
    ...source,
    id: destinationId,
    name: `${source.name} 복사본`,
    canvas: {
      ...source.canvas,
      backgroundImageUri: replaceProjectUri(
        source.canvas.backgroundImageUri,
        sourceRoot,
        destinationRoot,
      ),
      backgroundImageAssetId: source.canvas.backgroundImageAssetId
        ? assetIdMap.get(source.canvas.backgroundImageAssetId)
        : undefined,
    },
    layers,
    assets,
    analogConfig: source.analogConfig
      ? {
          ...source.analogConfig,
          hourHandLayerId: source.analogConfig.hourHandLayerId
            ? layerIdMap.get(source.analogConfig.hourHandLayerId)
            : undefined,
          minuteHandLayerId: source.analogConfig.minuteHandLayerId
            ? layerIdMap.get(source.analogConfig.minuteHandLayerId)
            : undefined,
        }
      : undefined,
    digitalConfig:
      source.digitalConfig && digitImageMap && digitAssetMap
        ? {
            ...source.digitalConfig,
            digitImageMap,
            digitAssetMap,
            transform: { ...source.digitalConfig.transform },
          }
        : undefined,
    previewImageUri: replaceProjectUri(
      source.previewImageUri,
      sourceRoot,
      destinationRoot,
    ),
    createdAt: now,
    updatedAt: now,
  };
};

export const clockProjectRepository: ClockProjectRepository = {
  async getAll() {
    const index = await getIndex();
    const projects = await Promise.all(
      index.map(async (item) => {
        try {
          return await this.getById(item.id);
        } catch (error: unknown) {
          console.error(
            `[ProjectRepository] Skipping damaged project ${item.id}`,
            error,
          );
          return null;
        }
      }),
    );

    return projects.filter(
      (project): project is ClockProject => project !== null,
    );
  },

  async getById(projectId) {
    const file = getProjectFile(projectId);
    if (!file.exists) {
      return null;
    }

    try {
      return migrateClockProject(JSON.parse(await file.text()) as unknown);
    } catch (error: unknown) {
      console.error(
        `[ProjectRepository] Failed to read project ${projectId}`,
        error,
      );
      throw new Error("저장된 프로젝트를 불러오지 못했어요.");
    }
  },

  async create(project) {
    try {
      await writeProject(project);
      await upsertIndexItem(project);
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to create project", error);
      const directory = getProjectDirectory(project.id);
      if (directory.exists) {
        directory.delete();
      }
      throw new Error("프로젝트를 만들지 못했어요.");
    }
  },

  async update(project) {
    try {
      await writeProject(project);
      await upsertIndexItem(project);
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to save project", error);
      throw new Error("프로젝트를 저장하지 못했어요.");
    }
  },

  async remove(projectId) {
    try {
      const index = await getIndex();
      await setIndex(index.filter((item) => item.id !== projectId));
      const directory = getProjectDirectory(projectId);
      if (directory.exists) {
        directory.delete();
      }
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to remove project", error);
      throw new Error("프로젝트를 삭제하지 못했어요.");
    }
  },

  async duplicate(projectId) {
    const source = await this.getById(projectId);
    if (!source) {
      throw new Error("복제할 프로젝트를 찾을 수 없어요.");
    }

    const destinationId = createId("project");
    const sourceDirectory = getProjectDirectory(projectId);
    const destinationDirectory = getProjectDirectory(destinationId);

    try {
      getProjectsDirectory().create({
        idempotent: true,
        intermediates: true,
      });
      await copyDirectoryContents(sourceDirectory, destinationDirectory);
      const duplicate = duplicateData(
        source,
        destinationId,
        destinationDirectory.uri,
      );
      await writeProject(duplicate);
      await upsertIndexItem(duplicate);
      return duplicate;
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to duplicate project", error);
      if (destinationDirectory.exists) {
        destinationDirectory.delete();
      }
      throw new Error("프로젝트를 복제하지 못했어요.");
    }
  },
};
