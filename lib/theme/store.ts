import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

type ThemeState = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (t) => set({ theme: t }),
      toggle: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    {
      name: "okmd_theme",
    }
  )
);
