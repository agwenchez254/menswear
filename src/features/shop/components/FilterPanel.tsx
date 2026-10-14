import type { FilterPanelProps } from "@/features/shop/models";
import { PRICE_MAX, PRICE_PRESETS, PRICE_STEP } from "@/features/shop/constants";
import { toggle } from "@/features/shop/lib/filters";
import { FilterSection } from "@/features/shop/components/FilterSection";
import { formatKES } from "@/lib/format";

/** Price, category, size, colour and quick toggles. Shared by the desktop sidebar and the mobile sheet. */
export function FilterPanel({ filters, pool, categories, sizes, swatches, onUpdate, onSetList }: FilterPanelProps) {
  const { min, max, cats, sizes: pickedSizes, colors, sale, fresh } = filters;

  return (
    <div>
      <FilterSection title="Price (KES)">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm tabular-nums">
            <span className="rounded-lg bg-surface px-3 py-2 ring-1 ring-ink/15">{formatKES(min)}</span>
            <span className="text-muted">to</span>
            <span className="rounded-lg bg-surface px-3 py-2 ring-1 ring-ink/15">{formatKES(max)}</span>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="sr-only">Minimum price</span>
              <input
                type="range"
                className="range"
                min={0}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={min}
                onChange={(e) => {
                  const next = Math.min(Number(e.target.value), max - PRICE_STEP);
                  onUpdate({ min: next > 0 ? String(next) : null });
                }}
              />
            </label>
            <label className="block">
              <span className="sr-only">Maximum price</span>
              <input
                type="range"
                className="range"
                min={0}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={max}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  onUpdate({ max: raw >= PRICE_MAX ? null : String(Math.max(raw, min + PRICE_STEP)) });
                }}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => onUpdate({ min: p.min ? String(p.min) : null, max: p.max === PRICE_MAX ? null : String(p.max) })}
                className="min-h-9 border border-line px-3 text-xs hover:border-ink [border-radius:var(--r-field)]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Category">
        <ul className="space-y-1">
          {categories.map((c) => (
            <li key={c.slug}>
              <label className="flex min-h-10 items-center gap-3 text-sm">
                <input type="checkbox" className="size-4 accent-[var(--fg)]" checked={cats.includes(c.slug)} onChange={() => onSetList("cat", toggle(cats, c.slug))} />
                <span className="flex-1">{c.label}</span>
                <span className="text-xs text-muted tabular-nums">{pool.filter((p) => p.category === c.slug).length}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              aria-pressed={pickedSizes.includes(s)}
              onClick={() => onSetList("size", toggle(pickedSizes, s))}
              className={`grid size-11 place-items-center rounded-lg border text-sm transition ${pickedSizes.includes(s) ? "border-ink bg-ink text-on-ink" : "border-line bg-surface hover:border-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Colour">
        <div className="flex flex-wrap gap-3">
          {swatches.map((c) => (
            <button
              key={c.name}
              aria-label={c.name}
              aria-pressed={colors.includes(c.name)}
              title={c.name}
              onClick={() => onSetList("color", toggle(colors, c.name))}
              className={`size-9 rounded-full border-2 transition ${colors.includes(c.name) ? "scale-110 border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Show only">
        <label className="flex min-h-10 items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--fg)]" checked={sale} onChange={() => onUpdate({ sale: sale ? null : "1" })} /> On sale
        </label>
        <label className="flex min-h-10 items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--fg)]" checked={fresh} onChange={() => onUpdate({ new: fresh ? null : "1" })} /> New arrivals
        </label>
      </FilterSection>
    </div>
  );
}
