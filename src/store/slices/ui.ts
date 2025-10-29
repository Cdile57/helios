import { StateCreator } from "zustand";

export type UiSlice = {
  dark: boolean;
  activeTab: "dashboard" | "scene";
  toggleDark: () => void;
  setActiveTab: (t: "dashboard" | "scene") => void;
};

export const createUiSlice: StateCreator<UiSlice> = (set, get) => ({
  dark: true,
  activeTab: "dashboard",
  toggleDark: () => set({ dark: !get().dark }),
  setActiveTab: (t) => set({ activeTab: t })
});
