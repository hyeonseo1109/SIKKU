import { create } from "zustand";

import type { ClockProject } from "./types";

type ClockProjectState = {
  projects: ClockProject[];
  currentProjectId: string | null;
  selectedLayerId: string | null;
  setProjects: (projects: ClockProject[]) => void;
  selectProject: (projectId: string | null) => void;
  selectLayer: (layerId: string | null) => void;
};

export const useClockProjectStore = create<ClockProjectState>((set) => ({
  projects: [],
  currentProjectId: null,
  selectedLayerId: null,
  setProjects: (projects) => set({ projects }),
  selectProject: (currentProjectId) => set({ currentProjectId }),
  selectLayer: (selectedLayerId) => set({ selectedLayerId }),
}));
