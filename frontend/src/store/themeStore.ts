import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,

  toggleTheme: () => {
    set((state) => {
      const newIsDark = !state.isDark;
      localStorage.setItem("theme", newIsDark ? "dark" : "light");
      if (newIsDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return { isDark: newIsDark };
    });
  },

  initTheme: () => {
    const theme = localStorage.getItem("theme");
    const isDark = theme === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
    set({ isDark });
  },
}));