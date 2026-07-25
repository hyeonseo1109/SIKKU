import { create } from "zustand";

import {
  clockProjectRepository,
  type DuplicateProjectStatus,
  type ProjectIndexItem,
} from "@/entities/clock-project";

type ProjectListState = {
  projects: ProjectIndexItem[];
  loading: boolean;
  error: string | null;
  duplicateStatuses: Record<string, DuplicateProjectStatus>;
  load: () => Promise<void>;
  duplicate: (projectId: string) => Promise<boolean>;
  remove: (projectId: string) => Promise<boolean>;
};

export const useProjectListStore = create<ProjectListState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  duplicateStatuses: {},

  load: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await clockProjectRepository.getAll();
      set({
        projects: projects.map(
          ({ id, name, previewImageUri, type, updatedAt }) => ({
            id,
            name,
            previewImageUri,
            type,
            updatedAt,
          }),
        ),
        loading: false,
      });
    } catch {
      set({
        loading: false,
        error: "프로젝트 목록을 불러오지 못했어요.",
      });
    }
  },

  duplicate: async (projectId) => {
    if (get().duplicateStatuses[projectId]) return false;
    try {
      await clockProjectRepository.duplicate(projectId, (status) => {
        set((state) => ({
          duplicateStatuses: {
            ...state.duplicateStatuses,
            [projectId]: status,
          },
          error: status === "error" ? state.error : null,
        }));
      });
      await get().load();
      return true;
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "프로젝트를 복제하지 못했어요.",
      });
      return false;
    } finally {
      set((state) => {
        const { [projectId]: _finished, ...duplicateStatuses } =
          state.duplicateStatuses;
        return { duplicateStatuses };
      });
    }
  },

  remove: async (projectId) => {
    try {
      await clockProjectRepository.remove(projectId);
      await get().load();
      return true;
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "프로젝트를 삭제하지 못했어요.",
      });
      return false;
    }
  },
}));
