import { create } from "zustand";

import type { ImageAsset } from "@/entities/image-asset";

import type { ImageTarget } from "./image-target";

export type PendingImageSelection = {
  projectId: string;
  asset: ImageAsset;
  target: ImageTarget;
};

type PendingImageState = {
  pending: PendingImageSelection | null;
  setPending: (pending: PendingImageSelection) => void;
  clear: () => void;
};

export const usePendingImageStore = create<PendingImageState>((set) => ({
  pending: null,
  setPending: (pending) => set({ pending }),
  clear: () => set({ pending: null }),
}));
