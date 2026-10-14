import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import type { HeroSectionProps } from "@/features/home/models";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetProductQuery } from "@/api/catalogue";
import { formatKES } from "@/lib/format";
import { productPath, ROUTES } from "@/config/routes";
import { Photo } from "@/components/ui/Photo";

/** Stagger helper: sets the CSS delay used by the `.rise` entrance. */
const delay = (s: number): CSSProperties => ({ ["--d" as string]: `${s}s` });

/**
 * Home hero. Motion is CSS only: a short fade-and-rise on load, staggered by delay.
 * No scroll listeners, no JavaScript animation, and it switches off under prefers-reduced-motion.
 */
export function HeroSection({ g, c }: HeroSectionProps) {
  const { currentData: featured } = useGetProductQuery(c.featuredProductSlug || skipToken);
  const women = g === "women";

  const text = (
    <div className={`flex flex-col justify-center px-4 py-14 md:px-8 lg:py-0 ${women ? "lg:pl-14 lg:pr-[max(2rem,calc((100vw-1400px)/2+2rem))]" : "lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-12"}`}>
      <h1 className="display text-[clamp(2.6rem,5.6vw,5.2rem)]">
        <span className="rise block whitespace-nowrap" style={delay(0)}>
          {c.lines[0]}
        </span>
        <span className="rise block whitespace-nowrap pb-[0.1em]" style={delay(0.08)}>
          <span className="relative inline-block whitespace-nowrap">
            <span aria-hidden className="wipe-in absolute inset-0 bg-accent [border-radius:var(--r-soft)]" />
            <span className="relative px-[0.12em] text-accent-ink">{c.lines[1]}</span>
          </span>
        </span>
      </h1>
      <p className="rise mt-7 max-w-[44ch] text-lg leading-relaxed text-muted" style={delay(0.16)}>
        {c.sub}
      </p>
      <div className="rise mt-9" style={delay(0.24)}>
        <Link to={ROUTES.shop} className="btn-accent group h-14 px-9 text-base">
          {c.cta} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );

  const tag = featured ? (
    <Link
      to={productPath(featured.slug)}
      className="group absolute bottom-0 left-0 z-10 flex items-center gap-4 bg-surface px-5 py-4 transition-colors hover:bg-ink hover:text-on-ink [border-radius:0_var(--r-tile)_0_0]"
    >
      <span>
        <span className="block text-xs text-muted group-hover:text-on-ink/70">Pictured</span>
        <span className="block font-semibold">{featured.name}</span>
        <span className="block text-sm tabular-nums">{formatKES(featured.price)}</span>
      </span>
      <ArrowUpRight size={22} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  ) : null;

  const image = women ? (
    <div className="relative min-h-[520px] overflow-hidden bg-accent/30 lg:order-first lg:min-h-0">
      <div className="fade-in absolute inset-x-[9%] bottom-0 top-[7%] overflow-hidden [border-radius:999px_999px_0_0]">
        <Photo src={c.image} alt={c.alt} w={1200} eager position={c.focalPoint} className="h-full w-full" />
      </div>
      {tag}
    </div>
  ) : (
    <div className="relative min-h-[460px] overflow-hidden bg-accent lg:min-h-0">
      <div className="fade-in absolute inset-0 lg:left-[12%]">
        <Photo src={c.image} alt={c.alt} w={1400} eager position={c.focalPoint} className="h-full w-full" />
      </div>
      {tag}
    </div>
  );

  return (
    <section className={`grid min-h-[calc(100dvh-68px)] overflow-hidden ${women ? "lg:grid-cols-[0.9fr_1fr]" : "lg:grid-cols-[1fr_0.9fr]"}`}>
      {text}
      {image}
    </section>
  );
}
