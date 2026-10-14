import type { Product, Swatch } from "@/models";
import type { ShopFilters, SortKey } from "@/features/shop/models";
import { PRICE_MAX, SIZE_ORDER } from "@/features/shop/constants";

const SORT_KEYS: SortKey[] = ["best", "new", "low", "high"];

const list = (params: URLSearchParams, key: string): string[] => params.get(key)?.split(",").filter(Boolean) ?? [];

/** Parse the shop query string into typed filters, falling back to defaults for anything invalid. */
export const readFilters = (params: URLSearchParams): ShopFilters => {
  const sort = params.get("sort");
  return {
    cats: list(params, "cat"),
    sizes: list(params, "size"),
    colors: list(params, "color"),
    min: Number(params.get("min") ?? 0) || 0,
    max: Number(params.get("max") ?? PRICE_MAX) || PRICE_MAX,
    sale: params.get("sale") === "1",
    fresh: params.get("new") === "1",
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "best",
    q: params.get("q") ?? "",
  };
};

export const toggle = (items: string[], value: string): string[] =>
  items.includes(value) ? items.filter((x) => x !== value) : [...items, value];

const sizeRank = (size: string): number => (SIZE_ORDER.includes(size) ? SIZE_ORDER.indexOf(size) : 100 + Number(size));

/** Every selectable size in the pool, clothing sizes first, then numeric. "One size" is not filterable. */
export const availableSizes = (pool: Product[]): string[] =>
  [...new Set(pool.flatMap((p) => p.sizes))].filter((s) => s !== "One size").sort((a, b) => sizeRank(a) - sizeRank(b));

export const availableSwatches = (pool: Product[]): Swatch[] => [...new Map(pool.flatMap((p) => p.colors).map((c) => [c.name, c] as const)).values()];

const compare = (sort: SortKey) => (a: Product, b: Product): number => {
  if (sort === "low") return a.price - b.price;
  if (sort === "high") return b.price - a.price;
  if (sort === "new") return Number(!!b.isNew) - Number(!!a.isNew) || b.sold - a.sold;
  return b.sold - a.sold;
};

/** Apply filters and sorting to a product pool. `term` is the (deferred) search text. */
export const filterProducts = (pool: Product[], f: ShopFilters, term: string): Product[] => {
  const needle = term.trim().toLowerCase();
  return pool
    .filter((p) => {
      if (f.cats.length && !f.cats.includes(p.category)) return false;
      if (p.price < f.min || p.price > f.max) return false;
      if (f.sizes.length && !f.sizes.some((s) => p.sizes.includes(s))) return false;
      if (f.colors.length && !p.colors.some((c) => f.colors.includes(c.name))) return false;
      if (f.sale && !p.compareAt) return false;
      if (f.fresh && !p.isNew) return false;
      if (needle && !`${p.name} ${p.categoryLabel}`.toLowerCase().includes(needle)) return false;
      return true;
    })
    .sort(compare(f.sort));
};
