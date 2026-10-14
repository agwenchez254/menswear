import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { productsFor } from "@/data/products";
import { categoriesByGender } from "@/data/categories";
import { Photo } from "@/components/ui/Photo";
import { homeConfig } from "@/features/home/config";
import type { HomeSectionProps } from "@/features/home/models";

export function CategoriesSection({ g }: HomeSectionProps) {
  const c = homeConfig[g];
  const cats = categoriesByGender[g];
  const all = productsFor(g);
  const first = c.grid.order[0];
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <h2 className="display max-w-[16ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">{c.catTitle}</h2>

      <div className={`mt-12 grid auto-rows-[165px] grid-cols-2 gap-2 sm:auto-rows-[210px] md:gap-3 lg:grid-cols-4 ${c.grid.rows}`}>
        {c.grid.order.map((slug) => {
          const cat = cats.find((x) => x.slug === slug)!;
          const count = all.filter((p) => p.category === slug).length;
          const big = slug === first;
          return (
            <div key={slug} className={c.grid.place[slug].cls}>
              <Link to={`/shop?cat=${slug}`} className="tile group relative block h-full bg-surface-2">
                <Photo id={cat.image} alt={`${cat.label} collection`} w={big ? 1100 : 700} position={c.grid.place[slug].pos} className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0d]/80 via-[#0d0f0d]/10 to-transparent" />
                <span className="absolute left-0 top-0 bg-accent px-2.5 py-1 text-xs font-bold tabular-nums text-accent-ink [border-radius:0_0_var(--r-soft)_0]">{count}</span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-[#eceee8] md:p-5">
                  <div>
                    <p className={`display ${big ? "text-[clamp(2rem,3.6vw,3.4rem)]" : "text-[clamp(1.35rem,2vw,1.9rem)]"}`}>{cat.label}</p>
                    {(big || slug === "jackets") && <p className="mt-2 hidden text-sm text-[#eceee8]/80 sm:block">{cat.tag}</p>}
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center bg-[#eceee8] text-[#0d0f0d] transition group-hover:bg-accent [border-radius:var(--r-soft)]">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            </div>
          );
        })}

        <div className={c.grid.place.all.cls}>
          <Link to="/shop" className="tile group flex h-full flex-col justify-between bg-accent p-5 text-accent-ink transition hover:bg-ink hover:text-on-ink md:p-6">
            <span className="display text-[clamp(1.6rem,2.6vw,2.4rem)]">Browse all {all.length} pieces</span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              Open the full shop <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
