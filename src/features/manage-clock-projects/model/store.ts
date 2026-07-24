import { create } from "zustand";

import {
  clockProjectRepository,
  type ProjectIndexItem,
} from "@/entities/clock-project";

type ProjectListState = {
  projects: ProjectIndexItem[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  duplicate: (projectId: string) => Promise<boolean>;
  remove: (projectId: string) => Promise<boolean>;
};

export const useProjectListStore = create<ProjectListState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

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
    try {
      await clockProjectRepository.duplicate(projectId);
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
