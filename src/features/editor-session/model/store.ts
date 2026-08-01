import { create } from "zustand";

export type EditorTab = "element" | "add" | "clock" | "background";

type EditorUiState = {
  selectedLayerId: string | null;
  activeTab: EditorTab;
  anchorEditing: boolean;
  selectLayer: (layerId: string | null) => void;
  setActiveTab: (tab: EditorTab) => void;
  setAnchorEditing: (editing: boolean) => void;
  reset: () => void;
};

export const useEditorUiStore = create<EditorUiState>((set) => ({
  selectedLayerId: null,
  activeTab: "add",
  anchorEditing: false,
  selectLayer: (selectedLayerId) => set({ selectedLayerId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setAnchorEditing: (anchorEditing) => set({ anchorEditing }),
  reset: () =>
    set({
      selectedLayerId: null,
      activeTab: "add",
      anchorEditing: false,
    }),
}));
