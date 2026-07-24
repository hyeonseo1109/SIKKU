import { create } from "zustand";

import type { NormalizedPoint } from "@/entities/image-asset";
import { closePolygon } from "@/shared/lib/geometry";

type ImageLassoState = {
  points: NormalizedPoint[];
  history: NormalizedPoint[][];
  beginPath: (point: NormalizedPoint) => void;
  appendPoint: (point: NormalizedPoint) => void;
  finishPath: () => void;
  restore: (points: NormalizedPoint[]) => void;
  undo: () => void;
  reset: () => void;
};

export const useImageLassoStore = create<ImageLassoState>((set) => ({
  points: [],
  history: [],

  beginPath: (point) =>
    set((state) => ({
      history: [...state.history, state.points].slice(-10),
      points: [point],
    })),

  appendPoint: (point) =>
    set((state) => {
      const previous = state.points.at(-1);
      if (
        previous &&
        Math.hypot(point.x - previous.x, point.y - previous.y) < 0.006
      ) {
        return state;
      }
      return { points: [...state.points, point] };
    }),

  finishPath: () => set((state) => ({ points: closePolygon(state.points) })),

  restore: (points) => set({ points, history: [] }),

  undo: () =>
    set((state) => ({
      points: state.history.at(-1) ?? [],
      history: state.history.slice(0, -1),
    })),

  reset: () => set({ points: [], history: [] }),
}));
