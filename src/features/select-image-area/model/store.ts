import { create } from "zustand";

import type { NormalizedPoint } from "@/entities/image-asset";
import { closePolygon, isValidPolygon } from "@/shared/lib/geometry";

type ImageLassoState = {
  regions: NormalizedPoint[][];
  activePoints: NormalizedPoint[];
  beginPath: (point: NormalizedPoint) => void;
  appendPoint: (point: NormalizedPoint) => void;
  finishPath: () => void;
  restore: (regions: NormalizedPoint[][]) => void;
  undo: () => void;
  reset: () => void;
};

export const useImageLassoStore = create<ImageLassoState>((set) => ({
  regions: [],
  activePoints: [],

  beginPath: (point) => set({ activePoints: [point] }),

  appendPoint: (point) =>
    set((state) => {
      const previous = state.activePoints.at(-1);
      if (
        previous &&
        Math.hypot(point.x - previous.x, point.y - previous.y) < 0.006
      ) {
        return state;
      }
      return { activePoints: [...state.activePoints, point] };
    }),

  finishPath: () =>
    set((state) => {
      const region = closePolygon(state.activePoints);
      return {
        activePoints: [],
        regions: isValidPolygon(region)
          ? [...state.regions, region]
          : state.regions,
      };
    }),

  restore: (regions) =>
    set({
      regions: regions.map((region) => [...region]),
      activePoints: [],
    }),

  undo: () =>
    set((state) => ({
      activePoints: [],
      regions: state.regions.slice(0, -1),
    })),

  reset: () => set({ regions: [], activePoints: [] }),
}));
