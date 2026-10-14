import { create } from "zustand";
import type { Gender, GenderState } from "@/models";

const KEY = "jabali-gender";

const read = (): Gender => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "men" || v === "women") return v;
  } catch {
    /* storage can be blocked */
  }
  return "men";
};

const apply = (g: Gender) => {
  document.documentElement.setAttribute("data-gender", g);
  try {
    localStorage.setItem(KEY, g);
  } catch {
    /* ignore */
  }
};

export const useGender = create<GenderState>((set, get) => ({
  gender: read(),
  pending: null,
  commit: (g) => {
    apply(g);
    set({ gender: g });
  },
  request: (g) => {
    if (g === get().gender || get().pending) return;
    set({ pending: g });
  },
  clearPending: () => set({ pending: null }),
}));
