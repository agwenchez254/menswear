import type { ReactNode } from "react";
import type { CartLine } from "./cart";
import type { Product } from "./product";

export interface PhotoProps {
  /** Unsplash photo ID (see data/photos.ts). */
  id: string;
  alt: string;
  /** Requested width in px. Smaller and larger variants are generated for srcSet. */
  w?: number;
  className?: string;
  /** Load immediately instead of lazily (use for the hero image). */
  eager?: boolean;
  /** CSS object-position, e.g. "50% 20%". */
  position?: string;
}

export interface GenderToggleProps {
  compact?: boolean;
  /** Unique layoutId so two toggles on one page do not share a highlight. */
  id?: string;
}

export interface ProductCardProps {
  product: Product;
  /** Position in a list, used to stagger the entrance. */
  index?: number;
}

export interface ThemeControls {
  dark: boolean;
  toggle: () => void;
}

export interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export interface CartLineItemProps {
  line: CartLine;
  onQty: (qty: number) => void;
  onRemove: () => void;
  /** Called when the product link is followed, so the drawer can close. */
  onNavigate: () => void;
}
