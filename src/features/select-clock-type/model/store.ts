import { create } from "zustand";

import type { ClockType } from "@/entities/clock-project";

type ClockTypeSelectionState = {
  selectedType: ClockType;
  selectType: (type: ClockType) => void;
};

export const useClockTypeSelection = create<ClockTypeSelectionState>((set) => ({
  selectedType: "analog",
  selectType: (selectedType) => set({ selectedType }),
}));
