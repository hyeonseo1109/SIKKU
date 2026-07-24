import { create } from "zustand";

import { clockProjectRepository } from "../api";
import type { ClockProject, SaveStatus } from "./types";

const MAX_HISTORY = 30;

const cloneProject = (project: ClockProject): ClockProject =>
  JSON.parse(JSON.stringify(project)) as ClockProject;

type ClockProjectState = {
  project: ClockProject | null;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  past: ClockProject[];
  future: ClockProject[];
  setProject: (project: ClockProject | null) => void;
  changeProject: (change: (project: ClockProject) => ClockProject) => void;
  replaceProjectWithoutHistory: (project: ClockProject) => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<boolean>;
  reset: () => void;
};

export const useClockProjectStore = create<ClockProjectState>((set, get) => ({
  project: null,
  saveStatus: "idle",
  lastSavedAt: null,
  past: [],
  future: [],

  setProject: (project) =>
    set({
      project: project ? cloneProject(project) : null,
      saveStatus: project ? "saved" : "idle",
      lastSavedAt: project?.updatedAt ?? null,
      past: [],
      future: [],
    }),

  changeProject: (change) =>
    set((state) => {
      if (!state.project) {
        return state;
      }

      const previous = cloneProject(state.project);
      const changed = change(cloneProject(state.project));
      const project = {
        ...changed,
        updatedAt: new Date().toISOString(),
      };

      return {
        project,
        saveStatus: "dirty",
        past: [...state.past, previous].slice(-MAX_HISTORY),
        future: [],
      };
    }),

  replaceProjectWithoutHistory: (project) =>
    set({ project, saveStatus: "dirty" }),

  undo: () =>
    set((state) => {
      const previous = state.past.at(-1);
      if (!state.project || !previous) {
        return state;
      }
      return {
        project: {
          ...cloneProject(previous),
          updatedAt: new Date().toISOString(),
        },
        saveStatus: "dirty",
        past: state.past.slice(0, -1),
        future: [cloneProject(state.project), ...state.future].slice(
          0,
          MAX_HISTORY,
        ),
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!state.project || !next) {
        return state;
      }
      return {
        project: {
          ...cloneProject(next),
          updatedAt: new Date().toISOString(),
        },
        saveStatus: "dirty",
        past: [...state.past, cloneProject(state.project)].slice(-MAX_HISTORY),
        future: state.future.slice(1),
      };
    }),

  save: async () => {
    const project = get().project;
    if (!project) {
      return false;
    }

    const savedVersion = project.updatedAt;
    set({ saveStatus: "saving" });

    try {
      await clockProjectRepository.update(project);
      const current = get().project;
      if (current?.updatedAt === savedVersion) {
        set({
          saveStatus: "saved",
          lastSavedAt: new Date().toISOString(),
        });
      } else {
        set({ saveStatus: "dirty" });
      }
      return true;
    } catch {
      set({ saveStatus: "error" });
      return false;
    }
  },

  reset: () =>
    set({
      project: null,
      saveStatus: "idle",
      lastSavedAt: null,
      past: [],
      future: [],
    }),
}));
