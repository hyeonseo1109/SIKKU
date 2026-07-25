import { Directory, File, Paths } from "expo-file-system";

import { storage } from "@/shared/storage";
import { createId } from "@/shared/lib/id";

import {
  createDuplicateProjectName,
  duplicateProjectData,
  type DuplicateProjectFileMap,
} from "../lib/duplicate";
import { migrateClockProject } from "../lib/migrations";
import { assertValidClockProject } from "../lib/validation";
import type { ClockProject, ProjectIndexItem } from "../model/types";
import {
  ensureProjectDirectories,
  getProjectDirectory,
  getProjectFile,
  getProjectsDirectory,
} from "./clock-project.paths";
import type {
  ClockProjectRepository,
  DuplicateClockProjectResult,
  DuplicateProjectStatus,
} from "./clock-project.repository.types";

const PROJECT_INDEX_KEY = "sikku.project-index.v1";
const PROJECT_FILE_NAME = "project.json";
const PROJECT_BACKUP_NAME = "project.json.backup";
const PROJECT_TEMP_NAME = "project.json.tmp";
const DUPLICATE_TEMP_PREFIX = ".duplicate-";
const duplicateOperations = new Map<
  string,
  Promise<DuplicateClockProjectResult>
>();

const toIndexItem = (project: ClockProject): ProjectIndexItem => ({
  id: project.id,
  name: project.name,
  type: project.type,
  previewImageUri: project.previewImageUri,
  updatedAt: project.updatedAt,
});

const getIndex = async (): Promise<ProjectIndexItem[]> => {
  try {
    const value =
      (await storage.getItem<ProjectIndexItem[]>(PROJECT_INDEX_KEY)) ?? [];
    return Array.isArray(value) ? value : [];
  } catch (error: unknown) {
    console.error("[ProjectRepository] Failed to read project index", error);
    return [];
  }
};

const setIndex = async (items: ProjectIndexItem[]) => {
  await storage.setItem(PROJECT_INDEX_KEY, items);
};

const sortIndex = (items: ProjectIndexItem[]) =>
  [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const upsertIndexItem = async (project: ClockProject) => {
  const current = await getIndex();
  await setIndex(
    sortIndex([
      toIndexItem(project),
      ...current.filter((item) => item.id !== project.id),
    ]),
  );
};

const parseProjectFile = async (file: File, checkFiles = false) => {
  const project = migrateClockProject(JSON.parse(await file.text()) as unknown);
  assertValidClockProject(project, { checkFiles });
  return project;
};

const writeProjectToDirectory = async (
  project: ClockProject,
  directory: Directory,
) => {
  assertValidClockProject(project);
  directory.create({ idempotent: true, intermediates: true });
  const main = new File(directory, PROJECT_FILE_NAME);
  const backup = new File(directory, PROJECT_BACKUP_NAME);
  const temporary = new File(directory, PROJECT_TEMP_NAME);

  if (temporary.exists) temporary.delete();
  temporary.create({ intermediates: true });
  temporary.write(JSON.stringify(project, null, 2));
  await parseProjectFile(temporary);

  if (main.exists) {
    await main.copy(backup, { overwrite: true });
  }
  await temporary.move(main, { overwrite: true });
};

const writeProject = async (project: ClockProject) => {
  ensureProjectDirectories(project.id);
  await writeProjectToDirectory(project, getProjectDirectory(project.id));
};

const readProjectWithRecovery = async (projectId: string) => {
  const directory = getProjectDirectory(projectId);
  const main = getProjectFile(projectId);
  const backup = new File(directory, PROJECT_BACKUP_NAME);
  const temporary = new File(directory, PROJECT_TEMP_NAME);

  if (main.exists) {
    try {
      return await parseProjectFile(main, true);
    } catch (error: unknown) {
      console.error(
        `[ProjectRepository] Main project file is damaged: ${projectId}`,
        error,
      );
    }
  }
  if (!backup.exists) return null;

  const recovered = await parseProjectFile(backup, true);
  if (temporary.exists) temporary.delete();
  await backup.copy(temporary, { overwrite: true });
  await temporary.move(main, { overwrite: true });
  return recovered;
};

const listReferencedUris = (project: ClockProject) => {
  const uris = new Set<string>();
  const add = (uri?: string) => {
    if (uri) uris.add(uri);
  };

  project.assets.forEach((asset) => {
    add(asset.originalUri);
    add(asset.processedUri);
  });
  project.layers.forEach((layer) => add(layer.imageUri));
  add(project.canvas.backgroundImageUri);
  add(project.previewImageUri);
  Object.values(project.digitalConfig?.digitImageMap ?? {}).forEach(add);
  return [...uris];
};

const extensionOf = (file: File) => {
  const match = /\.[a-z\d]+$/iu.exec(file.name);
  return match?.[0]?.toLowerCase() ?? ".bin";
};

const relativeAssetDirectory = (uri: string, sourceRoot: string) => {
  const relative = decodeURIComponent(uri.slice(sourceRoot.length)).replace(
    /^\/+/u,
    "",
  );
  const segments = relative.split("/");
  if (
    segments[0] === "assets" &&
    segments.length > 2 &&
    !segments.includes("..")
  ) {
    return segments.slice(0, -1).join("/");
  }
  return "assets/processed";
};

const ensureNestedDirectory = (root: Directory, relativePath: string) => {
  let directory = root;
  for (const segment of relativePath.split("/").filter(Boolean)) {
    directory = new Directory(directory, segment);
    directory.create({ idempotent: true, intermediates: true });
  }
  return directory;
};

const resolveNestedDirectory = (root: Directory, relativePath: string) => {
  let directory = root;
  for (const segment of relativePath.split("/").filter(Boolean)) {
    directory = new Directory(directory, segment);
  }
  return directory;
};

const assertEnoughStorage = (files: File[]) => {
  const requiredBytes = files.reduce(
    (total, file) => total + (file.size ?? 0),
    0,
  );
  const safetyMargin = Math.max(10 * 1024 * 1024, requiredBytes * 0.15);
  if (Paths.availableDiskSpace < requiredBytes + safetyMargin) {
    throw new Error("저장 공간이 부족해 시계를 복사할 수 없어요.");
  }
};

const copyReferencedFiles = async ({
  finalDirectory,
  source,
  temporaryDirectory,
}: {
  finalDirectory: Directory;
  source: ClockProject;
  temporaryDirectory: Directory;
}) => {
  const sourceRoot = getProjectDirectory(source.id).uri.replace(/\/+$/u, "");
  const uris = listReferencedUris(source);
  const sourceFiles = uris.map((uri) => {
    if (!uri.startsWith(`${sourceRoot}/`)) {
      throw new Error("프로젝트 밖의 이미지 경로가 있어 복사할 수 없어요.");
    }
    const file = new File(uri);
    if (!file.exists) {
      throw new Error("일부 이미지 파일을 찾지 못해 시계를 복사할 수 없어요.");
    }
    return file;
  });
  assertEnoughStorage(sourceFiles);

  const temporaryMap: DuplicateProjectFileMap = {};
  const finalMap: DuplicateProjectFileMap = {};
  for (const [index, uri] of uris.entries()) {
    const sourceFile = sourceFiles[index];
    if (!sourceFile) {
      throw new Error("복사할 이미지 목록이 올바르지 않아요.");
    }
    const relativeDirectory = relativeAssetDirectory(uri, sourceRoot);
    const fileName = `${createId("file")}${extensionOf(sourceFile)}`;
    const temporaryFile = new File(
      ensureNestedDirectory(temporaryDirectory, relativeDirectory),
      fileName,
    );
    const finalFile = new File(
      resolveNestedDirectory(finalDirectory, relativeDirectory),
      fileName,
    );
    await sourceFile.copy(temporaryFile);
    if (!temporaryFile.exists || temporaryFile.size !== sourceFile.size) {
      throw new Error("이미지 파일 복사를 확인하지 못했어요.");
    }
    temporaryMap[uri] = temporaryFile.uri;
    finalMap[uri] = finalFile.uri;
  }
  return { copiedAssetCount: uris.length, finalMap, temporaryMap };
};

const cleanupInterruptedDuplicates = () => {
  const projects = getProjectsDirectory();
  if (!projects.exists) return;
  for (const entry of projects.list()) {
    if (
      entry instanceof Directory &&
      entry.name.startsWith(DUPLICATE_TEMP_PREFIX)
    ) {
      entry.delete();
    }
  }
};

const reconcileIndex = async (repository: ClockProjectRepository) => {
  const projectsDirectory = getProjectsDirectory();
  projectsDirectory.create({ idempotent: true, intermediates: true });
  cleanupInterruptedDuplicates();

  const projects: ClockProject[] = [];
  for (const entry of projectsDirectory.list()) {
    if (!(entry instanceof Directory) || entry.name.startsWith(".")) continue;
    try {
      const project = await repository.getById(entry.name);
      if (project) projects.push(project);
    } catch (error: unknown) {
      console.error(
        `[ProjectRepository] Isolated damaged project ${entry.name}`,
        error,
      );
    }
  }
  await setIndex(sortIndex(projects.map(toIndexItem)));
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const runDuplicate = async (
  repository: ClockProjectRepository,
  projectId: string,
  onStatus?: (status: DuplicateProjectStatus) => void,
): Promise<DuplicateClockProjectResult> => {
  onStatus?.("preparing");
  const source = await repository.getById(projectId);
  if (!source) throw new Error("복제할 프로젝트를 찾을 수 없어요.");
  assertValidClockProject(source, { checkFiles: true });

  const projects = await repository.getAll();
  const destinationId = createId("project");
  const finalDirectory = getProjectDirectory(destinationId);
  const temporaryDirectory = new Directory(
    getProjectsDirectory(),
    `${DUPLICATE_TEMP_PREFIX}${destinationId}`,
  );
  if (finalDirectory.exists || temporaryDirectory.exists) {
    throw new Error("새 프로젝트 ID가 충돌했어요. 다시 시도해 주세요.");
  }

  try {
    temporaryDirectory.create({ intermediates: true });
    onStatus?.("copying-assets");
    const { copiedAssetCount, finalMap, temporaryMap } =
      await copyReferencedFiles({
        finalDirectory,
        source,
        temporaryDirectory,
      });
    const name = createDuplicateProjectName(
      source.name,
      projects.map((project) => project.name),
    );
    const duplicated = duplicateProjectData({
      destinationId,
      fileMap: temporaryMap,
      name,
      source,
    });
    const temporaryProject = duplicated.project;
    assertValidClockProject(temporaryProject, { checkFiles: true });

    onStatus?.("saving");
    const finalProject = duplicateProjectData({
      destinationId,
      fileMap: finalMap,
      ids: duplicated.ids,
      name,
      source,
    }).project;
    await writeProjectToDirectory(finalProject, temporaryDirectory);
    await temporaryDirectory.move(finalDirectory);
    assertValidClockProject(finalProject, { checkFiles: true });
    await upsertIndexItem(finalProject);
    onStatus?.("success");
    return { project: finalProject, copiedAssetCount };
  } catch (error: unknown) {
    onStatus?.("error");
    if (temporaryDirectory.exists) temporaryDirectory.delete();
    if (finalDirectory.exists) finalDirectory.delete();
    throw error;
  }
};

export const clockProjectRepository: ClockProjectRepository = {
  async getAll() {
    try {
      return await reconcileIndex(this);
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to reconcile projects", error);
      const index = await getIndex();
      const projects = await Promise.all(
        index.map((item) => this.getById(item.id).catch(() => null)),
      );
      return projects.filter(
        (project): project is ClockProject => project !== null,
      );
    }
  },

  async getById(projectId) {
    if (!projectId || projectId.includes("/") || projectId.includes("..")) {
      return null;
    }
    try {
      return await readProjectWithRecovery(projectId);
    } catch (error: unknown) {
      console.error(
        `[ProjectRepository] Failed to read project ${projectId}`,
        error,
      );
      throw new Error("저장된 프로젝트를 불러오지 못했어요.");
    }
  },

  async create(project) {
    const directory = getProjectDirectory(project.id);
    if (directory.exists) throw new Error("같은 ID의 프로젝트가 이미 있어요.");
    try {
      await writeProject(project);
      await upsertIndexItem(project);
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to create project", error);
      if (directory.exists) directory.delete();
      throw new Error("프로젝트를 만들지 못했어요.");
    }
  },

  async update(project) {
    try {
      await writeProject(project);
      await upsertIndexItem(project);
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to save project", error);
      throw new Error(
        error instanceof Error && error.message.includes("공간")
          ? error.message
          : "프로젝트를 저장하지 못했어요.",
      );
    }
  },

  async remove(projectId) {
    try {
      const directory = getProjectDirectory(projectId);
      if (directory.exists) directory.delete();
      const index = await getIndex();
      await setIndex(index.filter((item) => item.id !== projectId));
    } catch (error: unknown) {
      console.error("[ProjectRepository] Failed to remove project", error);
      throw new Error("프로젝트를 삭제하지 못했어요.");
    }
  },

  duplicate(projectId, onStatus) {
    const current = duplicateOperations.get(projectId);
    if (current) return current;

    const operation = runDuplicate(this, projectId, onStatus).finally(() => {
      duplicateOperations.delete(projectId);
    });
    duplicateOperations.set(projectId, operation);
    return operation;
  },
};
