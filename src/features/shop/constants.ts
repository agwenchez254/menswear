import type { PricePreset, SortOption } from "@/features/shop/models";

/** Upper bound of the price slider, in KES. Reaching it means "no upper limit". */
export const PRICE_MAX = 25_000;
export const PRICE_STEP = 500;

export const SORT_OPTIONS: SortOption[] = [
  { value: "best", label: "Best selling" },
  { value: "new", label: "Newest" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

export const PRICE_PRESETS: PricePreset[] = [
  { label: "Under 3k", min: 0, max: 3000 },
  { label: "3k to 8k", min: 3000, max: 8000 },
  { label: "8k to 15k", min: 8000, max: 15000 },
  { label: "15k+", min: 15000, max: PRICE_MAX },
];

/** Clothing sizes sort in this order; numeric sizes (shoes, jeans) follow by value. */
export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

/** Simulated catalogue load so skeletons show; remove when products come from an API. */
export const SKELETON_MS = 120;
