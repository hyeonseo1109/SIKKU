import type { ClockProject } from "../model/types";

export type DuplicateProjectStatus =
  "idle" | "preparing" | "copying-assets" | "saving" | "success" | "error";

export type DuplicateClockProjectResult = {
  project: ClockProject;
  copiedAssetCount: number;
};

export type ClockProjectRepository = {
  getAll: () => Promise<ClockProject[]>;
  getById: (projectId: string) => Promise<ClockProject | null>;
  create: (project: ClockProject) => Promise<void>;
  update: (project: ClockProject) => Promise<void>;
  remove: (projectId: string) => Promise<void>;
  duplicate: (
    projectId: string,
    onStatus?: (status: DuplicateProjectStatus) => void,
  ) => Promise<DuplicateClockProjectResult>;
};
