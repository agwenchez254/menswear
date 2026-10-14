import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Funnel, X } from "@phosphor-icons/react";
import type { CategoryDef, Product } from "@/models";
import type { FilterChip } from "@/features/shop/models";
import { useGetCategoriesQuery, useGetProductsQuery } from "@/api/catalogue";
import { useGender } from "@/store/gender";
import { formatKES } from "@/lib/format";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { PRICE_MAX, SORT_OPTIONS } from "@/features/shop/constants";
import { availableSizes, availableSwatches, filterProducts } from "@/features/shop/lib/filters";
import { useShopFilters } from "@/features/shop/hooks/useShopFilters";
import { FilterPanel } from "@/features/shop/components/FilterPanel";
import { FilterSheet } from "@/features/shop/components/FilterSheet";
import { EmptyResults } from "@/features/shop/components/EmptyResults";

const NO_PRODUCTS: Product[] = [];
const NO_CATEGORIES: CategoryDef[] = [];

export default function ShopPage() {
  const gender = useGender((s) => s.gender);
  const { filters, update, setList, reset } = useShopFilters();
  const [sheetOpen, setSheetOpen] = useState(false);

  // currentData (not data) so switching men/women never shows the other side's products.
  const productsQuery = useGetProductsQuery(gender);
  const categoriesQuery = useGetCategoriesQuery(gender);
  const pool = productsQuery.currentData ?? NO_PRODUCTS;
  const categories = categoriesQuery.currentData ?? NO_CATEGORIES;
  const loading = productsQuery.currentData === undefined && !productsQuery.isError;
  const failed = productsQuery.currentData === undefined && productsQuery.isError;

  const sizes = useMemo(() => availableSizes(pool), [pool]);
  const swatches = useMemo(() => availableSwatches(pool), [pool]);

  const deferredQuery = useDeferredValue(filters.q);
  const results = useMemo(() => filterProducts(pool, filters, deferredQuery), [pool, filters, deferredQuery]);

  // Lock page scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const { cats, sizes: pickedSizes, colors, min, max, sale, fresh, q, sort } = filters;
  const chips: FilterChip[] = [
    ...cats.map((c) => ({ label: categories.find((x) => x.slug === c)?.label ?? c, clear: () => setList("cat", cats.filter((x) => x !== c)) })),
    ...pickedSizes.map((s) => ({ label: `Size ${s}`, clear: () => setList("size", pickedSizes.filter((x) => x !== s)) })),
    ...colors.map((c) => ({ label: c, clear: () => setList("color", colors.filter((x) => x !== c)) })),
    ...(min > 0 || max < PRICE_MAX ? [{ label: `${formatKES(min)} to ${formatKES(max)}`, clear: () => update({ min: null, max: null }) }] : []),
    ...(sale ? [{ label: "On sale", clear: () => update({ sale: null }) }] : []),
    ...(fresh ? [{ label: "New arrivals", clear: () => update({ new: null }) }] : []),
    ...(q ? [{ label: `"${q}"`, clear: () => update({ q: null }) }] : []),
  ];

  const panel = <FilterPanel filters={filters} pool={pool} categories={categories} sizes={sizes} swatches={swatches} onUpdate={update} onSetList={setList} />;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-10 md:px-8 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="mt-2 display text-5xl md:text-6xl">The full collection</h1>
        <div className="flex items-center gap-3">
          <button className="btn-ghost lg:hidden" onClick={() => setSheetOpen(true)}>
            <Funnel size={18} /> Filters{chips.length > 0 && ` (${chips.length})`}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted max-sm:sr-only">Sort</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value === "best" ? null : e.target.value })} className="field h-11 w-auto py-0 pr-8 text-sm">
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden self-start lg:sticky lg:top-32 lg:block" aria-label="Filters">
          {panel}
        </aside>

        <div>
          <div className="flex min-h-9 flex-wrap items-center gap-2">
            <p className="mr-2 text-sm text-muted" aria-live="polite">
              {loading ? "Loading..." : `${results.length} ${results.length === 1 ? "product" : "products"}`}
            </p>
            {chips.map((c) => (
              <button key={c.label} onClick={c.clear} className="inline-flex min-h-9 items-center gap-1.5 bg-ink px-3 text-xs text-on-ink hover:bg-ink-2 [border-radius:var(--r-btn)]" aria-label={`Remove filter ${c.label}`}>
                {c.label} <X size={12} />
              </button>
            ))}
            {chips.length > 1 && (
              <button onClick={reset} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
                Clear all
              </button>
            )}
          </div>

          {failed ? (
            <ErrorState title="We could not load the shop" onRetry={() => void productsQuery.refetch()} />
          ) : loading ? (
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyResults onReset={reset} />
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 xl:grid-cols-3">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onClear={reset} resultCount={results.length}>
        {panel}
      </FilterSheet>
    </div>
  );
}
