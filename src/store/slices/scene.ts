import { StateCreator } from "zustand";

export type SceneSlice = {
  rotation: number;
  setRotation: (r: number) => void;
};

export const createSceneSlice: StateCreator<SceneSlice> = (set) => ({
  rotation: 0,
  setRotation: (r) => set({ rotation: r })
});
