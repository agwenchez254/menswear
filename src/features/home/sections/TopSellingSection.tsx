import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { topSellingFor } from "@/data/products";
import { Photo } from "@/components/ui/Photo";
import { ProductCard } from "@/components/product/ProductCard";
import { formatKES } from "@/lib/format";
import { homeConfig } from "@/features/home/config";
import type { HomeSectionProps } from "@/features/home/models";

export function TopSellingSection({ g }: HomeSectionProps) {
  const [lead, ...rest] = topSellingFor(g);
  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display max-w-[14ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">{homeConfig[g].topTitle}</h2>
          <Link to="/shop?sort=best" className="btn-ghost">
            See all bestsellers
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 lg:grid-cols-4">
          <div className="col-span-2 lg:row-span-2">
            <Link to={`/product/${lead.id}`} className="tile group relative block h-full min-h-[460px] bg-surface-2">
              <Photo id={lead.images[0]} alt={lead.name} w={1100} position="50% 25%" className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0d]/80 via-transparent to-transparent" />
              <span className="absolute left-0 top-0 bg-ink px-3 py-1.5 text-sm font-semibold text-on-ink [border-radius:0_0_var(--r-soft)_0]">Best seller this month</span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-[#eceee8] md:p-7">
                <div>
                  <p className="display text-[clamp(1.8rem,3vw,2.8rem)]">{lead.name}</p>
                  <p className="mt-2 tabular-nums">{formatKES(lead.price)}</p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center bg-accent text-accent-ink transition group-hover:bg-[#eceee8] [border-radius:var(--r-soft)]">
                  <ArrowUpRight size={22} />
                </span>
              </div>
            </Link>
          </div>
          {rest.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
