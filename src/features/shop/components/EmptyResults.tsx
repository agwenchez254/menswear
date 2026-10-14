import { MagnifyingGlass } from "@phosphor-icons/react";
import type { EmptyResultsProps } from "@/features/shop/models";

export function EmptyResults({ onReset }: EmptyResultsProps) {
  return (
    <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-line py-24 text-center">
      <div className="grid size-16 place-items-center bg-ink/5">
        <MagnifyingGlass size={28} />
      </div>
      <h2 className="mt-5 display text-3xl">Nothing matches those filters</h2>
      <p className="mt-2 max-w-[38ch] text-sm text-muted">Try widening the price range or removing a size or colour.</p>
      <button className="btn-dark mt-6" onClick={onReset}>
        Reset filters
      </button>
    </div>
  );
}
