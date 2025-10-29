import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { createUiSlice, UiSlice } from "./slices/ui";
import { createDataSlice, DataSlice } from "./slices/data";
import { createSceneSlice, SceneSlice } from "./slices/scene";

export type RootState = UiSlice & DataSlice & SceneSlice;

export const useStore = create<RootState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUiSlice(...a),
        ...createDataSlice(...a),
        ...createSceneSlice(...a)
      }),
      { name: "helios-state" }
    )
  )
);
