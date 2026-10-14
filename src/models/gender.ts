import type { Gender } from "./product";

export interface GenderState {
  gender: Gender;
  /** Target while the transition curtain is covering the page. */
  pending: Gender | null;
  /** Swap the theme immediately (used mid-transition and for reduced motion). */
  commit: (g: Gender) => void;
  /** Ask for a switch; the curtain component performs it. */
  request: (g: Gender) => void;
  clearPending: () => void;
}
