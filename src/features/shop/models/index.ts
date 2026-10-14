import type { ReactNode } from "react";
import type { CategoryDef, Product, Swatch } from "@/models";

export type SortKey = "best" | "new" | "low" | "high";

export interface SortOption {
  value: SortKey;
  label: string;
}

/** Which URL list parameter a multi-select filter writes to. */
export type ListKey = "cat" | "size" | "color";

/** Parsed shop filters, read from the URL query string. */
export interface ShopFilters {
  cats: string[];
  sizes: string[];
  colors: string[];
  min: number;
  max: number;
  sale: boolean;
  fresh: boolean;
  sort: SortKey;
  q: string;
}

/** Partial URL update. `null` or an empty string removes the parameter. */
export type FilterPatch = Record<string, string | null>;

export interface PricePreset {
  label: string;
  min: number;
  max: number;
}

/** A removable chip for an active filter. */
export interface FilterChip {
  label: string;
  clear: () => void;
}

export interface FilterSectionProps {
  title: string;
  children: ReactNode;
}

export interface FilterPanelProps {
  filters: ShopFilters;
  /** Products on the current side of the store, unfiltered. Used for per-category counts. */
  pool: Product[];
  categories: CategoryDef[];
  sizes: string[];
  swatches: Swatch[];
  onUpdate: (patch: FilterPatch) => void;
  onSetList: (key: ListKey, list: string[]) => void;
}

export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  resultCount: number;
  children: ReactNode;
}

export interface EmptyResultsProps {
  onReset: () => void;
}
