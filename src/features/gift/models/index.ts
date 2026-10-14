import type { Product } from "@/models";

export interface WrapOption {
  id: string;
  name: string;
  /** Box colour. */
  hex: string;
  /** Shaded edge colour. */
  dark: string;
}

export interface RibbonOption {
  id: string;
  name: string;
  hex: string;
}

export interface GiftUnwrapProps {
  product: Product | undefined;
  /** Kept for callers that pass the chosen colour; the preview photo comes from the product. */
  color?: string;
  wrap: string;
  ribbon: string;
  message: string;
  from: string;
  to: string;
  /** Change this to replay the animation. */
  runKey: number;
  /** Show the opened gift immediately, with no animation or confetti. */
  instant?: boolean;
}

export interface ConfettiProps {
  /** Burst counter: change it to fire a new burst. */
  run: number;
  count: number;
}
