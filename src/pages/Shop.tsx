import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Funnel, MagnifyingGlass, X } from "@phosphor-icons/react";
import { categoriesByGender, formatKES, productsFor } from "../data/products";
import { useGender } from "../store/gender";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";

const MAX = 25000;
const STEP = 500;
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
const sizeRank = (s: string) => (SIZE_ORDER.includes(s) ? SIZE_ORDER.indexOf(s) : 100 + Number(s));

const sorts = [
  { v: "best", l: "Best selling" },
  { v: "new", l: "Newest" },
  { v: "low", l: "Price: low to high" },
  { v: "high", l: "Price: high to low" },
];

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-sm font-semibold uppercase tracking-wider">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const gender = useGender((st) => st.gender);
  const pool = useMemo(() => productsFor(gender), [gender]);
  const catDefs = categoriesByGender[gender];
  const SIZES = useMemo(() => [...new Set(pool.flatMap((x) => x.sizes))].filter((x) => x !== "One size").sort((a, b) => sizeRank(a) - sizeRank(b)), [pool]);
  const swatches = useMemo(() => [...new Map(pool.flatMap((x) => x.colors).map((c) => [c.name, c])).values()], [pool]);

  const cats = params.get("cat")?.split(",").filter(Boolean) ?? [];
  const sizes = params.get("size")?.split(",").filter(Boolean) ?? [];
  const colors = params.get("color")?.split(",").filter(Boolean) ?? [];
  const min = Number(params.get("min") ?? 0);
  const max = Number(params.get("max") ?? MAX);
  const sale = params.get("sale") === "1";
  const fresh = params.get("new") === "1";
  const sort = params.get("sort") ?? "best";
  const q = params.get("q") ?? "";
  const deferredQ = useDeferredValue(q);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  const setList = (key: string, list: string[]) => update({ [key]: list.length ? list.join(",") : null });

  const results = useMemo(() => {
    const term = deferredQ.trim().toLowerCase();
    const list = pool.filter((p) => {
      if (cats.length && !cats.includes(p.category)) return false;
      if (p.price < min || p.price > max) return false;
      if (sizes.length && !sizes.some((s) => p.sizes.includes(s))) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c.name))) return false;
      if (sale && !p.compareAt) return false;
      if (fresh && !p.isNew) return false;
      if (term && !`${p.name} ${p.category} ${p.blurb}`.toLowerCase().includes(term)) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "new") return Number(!!b.isNew) - Number(!!a.isNew) || b.sold - a.sold;
      return b.sold - a.sold;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, deferredQ, pool]);

  const chips: { label: string; clear: () => void }[] = [
    ...cats.map((c) => ({ label: catDefs.find((x) => x.slug === c)?.label ?? c, clear: () => setList("cat", cats.filter((x) => x !== c)) })),
    ...sizes.map((s) => ({ label: `Size ${s}`, clear: () => setList("size", sizes.filter((x) => x !== s)) })),
    ...colors.map((c) => ({ label: c, clear: () => setList("color", colors.filter((x) => x !== c)) })),
    ...(min > 0 || max < MAX ? [{ label: `${formatKES(min)} to ${formatKES(max)}`, clear: () => update({ min: null, max: null }) }] : []),
    ...(sale ? [{ label: "On sale", clear: () => update({ sale: null }) }] : []),
    ...(fresh ? [{ label: "New arrivals", clear: () => update({ new: null }) }] : []),
    ...(q ? [{ label: `"${q}"`, clear: () => update({ q: null }) }] : []),
  ];

  const filters = (
    <div>
      <Section title="Price (KES)">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm tabular-nums">
            <span className="rounded-lg bg-surface px-3 py-2 ring-1 ring-ink/15">{formatKES(min)}</span>
            <span className="text-muted">to</span>
            <span className="rounded-lg bg-surface px-3 py-2 ring-1 ring-ink/15">{formatKES(max)}</span>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="sr-only">Minimum price</span>
              <input type="range" className="range" min={0} max={MAX} step={STEP} value={min} onChange={(e) => update({ min: Math.min(Number(e.target.value), max - STEP) > 0 ? String(Math.min(Number(e.target.value), max - STEP)) : null })} />
            </label>
            <label className="block">
              <span className="sr-only">Maximum price</span>
              <input type="range" className="range" min={0} max={MAX} step={STEP} value={max} onChange={(e) => update({ max: Number(e.target.value) >= MAX ? null : String(Math.max(Number(e.target.value), min + STEP)) })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["Under 3k", 0, 3000],
              ["3k to 8k", 3000, 8000],
              ["8k to 15k", 8000, 15000],
              ["15k+", 15000, MAX],
            ].map(([l, a, b]) => (
              <button key={l as string} onClick={() => update({ min: a ? String(a) : null, max: b === MAX ? null : String(b) })} className="min-h-9 border border-line px-3 text-xs hover:border-ink [border-radius:var(--r-field)]">
                {l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Category">
        <ul className="space-y-1">
          {catDefs.map((c) => (
            <li key={c.slug}>
              <label className="flex min-h-10 items-center gap-3 text-sm">
                <input type="checkbox" className="size-4 accent-[var(--fg)]" checked={cats.includes(c.slug)} onChange={() => setList("cat", toggle(cats, c.slug))} />
                <span className="flex-1">{c.label}</span>
                <span className="text-xs text-muted tabular-nums">{pool.filter((p) => p.category === c.slug).length}</span>
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} aria-pressed={sizes.includes(s)} onClick={() => setList("size", toggle(sizes, s))} className={`grid size-11 place-items-center rounded-lg border text-sm transition ${sizes.includes(s) ? "border-ink bg-ink text-on-ink" : "border-line bg-surface hover:border-ink"}`}>
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Colour">
        <div className="flex flex-wrap gap-3">
          {swatches.map((c) => (
            <button key={c.name} aria-label={c.name} aria-pressed={colors.includes(c.name)} title={c.name} onClick={() => setList("color", toggle(colors, c.name))} className={`size-9 rounded-full border-2 transition ${colors.includes(c.name) ? "scale-110 border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: c.hex }} />
          ))}
        </div>
      </Section>

      <Section title="Show only">
        <label className="flex min-h-10 items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--fg)]" checked={sale} onChange={() => update({ sale: sale ? null : "1" })} /> On sale
        </label>
        <label className="flex min-h-10 items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--fg)]" checked={fresh} onChange={() => update({ new: fresh ? null : "1" })} /> New arrivals
        </label>
      </Section>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-10 md:px-8 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-2 display text-5xl md:text-6xl">The full collection</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost lg:hidden" onClick={() => setSheet(true)}>
            <Funnel size={18} /> Filters{chips.length > 0 && ` (${chips.length})`}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted max-sm:sr-only">Sort</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value === "best" ? null : e.target.value })} className="field h-11 w-auto py-0 pr-8 text-sm">
              {sorts.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden self-start lg:sticky lg:top-32 lg:block" aria-label="Filters">
          {filters}
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
              <button onClick={() => setParams({}, { replace: true })} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
                Clear all
              </button>
            )}
          </div>

          {loading ? (
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-line py-24 text-center">
              <div className="grid size-16 place-items-center bg-ink/5">
                <MagnifyingGlass size={28} />
              </div>
              <h2 className="mt-5 display text-3xl">Nothing matches those filters</h2>
              <p className="mt-2 max-w-[38ch] text-sm text-muted">Try widening the price range or removing a size or colour.</p>
              <button className="btn-dark mt-6" onClick={() => setParams({}, { replace: true })}>
                Reset filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 xl:grid-cols-3">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sheet && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-ink/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl bg-paper lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="display text-2xl">Filters</h2>
                <button className="grid size-11 place-items-center hover:bg-ink/5" onClick={() => setSheet(false)} aria-label="Close filters">
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
              <div className="flex gap-3 border-t border-line p-4">
                <button className="btn-ghost flex-1" onClick={() => setParams({}, { replace: true })}>
                  Clear
                </button>
                <button className="btn-dark flex-[2]" onClick={() => setSheet(false)}>
                  Show {results.length} products
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
