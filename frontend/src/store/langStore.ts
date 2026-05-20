import { create } from "zustand";
import tr from "@/locales/tr";
import en from "@/locales/en";

type Language = "tr" | "en";

interface LangState {
  lang: Language;
  t: typeof tr;
  toggleLang: () => void;
  initLang: () => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: "tr",
  t: tr,

  toggleLang: () => {
    set((state) => {
      const newLang: Language = state.lang === "tr" ? "en" : "tr";
      localStorage.setItem("lang", newLang);
      return { lang: newLang, t: newLang === "tr" ? tr : en };
    });
  },

  initLang: () => {
    const lang = localStorage.getItem("lang") as Language | null;
    if (lang) {
      set({ lang, t: lang === "tr" ? tr : en });
    }
  },
}));