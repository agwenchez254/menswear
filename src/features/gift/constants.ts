import type { RibbonOption, WrapOption } from "@/features/gift/models";

/** Box colours offered in the gift builder. */
export const WRAPS: WrapOption[] = [
  { id: "burgundy", name: "Burgundy", hex: "#6b1f2a", dark: "#4a1520" },
  { id: "forest", name: "Forest", hex: "#24493a", dark: "#17312a" },
  { id: "midnight", name: "Midnight", hex: "#1f2a44", dark: "#141b2f" },
  { id: "kraft", name: "Kraft", hex: "#a68460", dark: "#836445" },
];

/** Ribbon colours offered in the gift builder. */
export const RIBBONS: RibbonOption[] = [
  { id: "gold", name: "Citron", hex: "#c6e24f" },
  { id: "cream", name: "Bone", hex: "#eceee8" },
  { id: "black", name: "Onyx", hex: "#1c1917" },
];

/** Longest card message, in characters. */
export const MAX_MESSAGE_LENGTH = 160;
