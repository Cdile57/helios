import { create } from "zustand";

type LayoutState = {
  // 店内
  roomW: number;
  roomD: number;
  wallH: number;

  // 入口
  doorX: number;
  snapEnabled: boolean;
  snapStep: number;
  showGizmo: boolean;

  // ビュー
  showGrid: boolean;
  ambient: number;
  directional: number;

  // setter
  set: (p: Partial<LayoutState>) => void;
  resetDoor: () => void;
};

export const useStore = create<LayoutState>((set) => ({
  // 初期値
  roomW: 16,
  roomD: 12,
  wallH: 3.6,

  doorX: 0,
  snapEnabled: true,
  snapStep: 0.1,
  showGizmo: true,

  showGrid: false,
  ambient: 0.6,
  directional: 1.8,

  set: (p) => set(p),
  resetDoor: () => set({ doorX: 0 }),
}));
