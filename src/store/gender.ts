import { create } from "zustand";
import type { Gender } from "../data/products";

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

interface GenderState {
  gender: Gender;
  /** Target while the transition curtain is covering the page. */
  pending: Gender | null;
  /** Swap the theme immediately (used mid-transition and for reduced motion). */
  commit: (g: Gender) => void;
  /** Ask for a switch; the curtain component performs it. */
  request: (g: Gender) => void;
  clearPending: () => void;
}

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
