import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { ReviewsSectionProps } from "@/features/home/models";

export function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-ink">
      {initials}
    </span>
  );
}

export function ReviewsSection({ g, items }: ReviewsSectionProps) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => setI(0), [g]);
  useEffect(() => {
    if (paused || reduce || count < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % count), 5000);
    return () => clearInterval(t);
  }, [paused, reduce, count]);

  if (count === 0) return null;
  const go = (n: number) => setI((n + count) % count);
  // The list can shrink live (an editor unpublishes a review), so keep the index in range.
  const current = Math.min(i, count - 1);
  const r = items[current];
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <h2 className="display max-w-[12ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">{g === "men" ? "Worn and approved" : "Loved and worn"}</h2>
      <div
        className="mt-14 max-w-4xl"
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer reviews"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(current - 1);
          if (e.key === "ArrowRight") go(current + 1);
        }}
      >
        <div className="min-h-[15rem] md:min-h-[13rem]" aria-live={paused ? "polite" : "off"}>
          <AnimatePresence mode="wait">
            <motion.figure key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
              <blockquote className="display text-[clamp(1.5rem,3vw,2.6rem)] leading-[1.1]">&ldquo;{r.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-sm">
                <Avatar name={r.name} />
                <span>
                  <span className="block font-semibold">{r.name}</span>
                  <span className="text-muted">{r.location}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {items.map((o, n) => (
              <button key={o.id} onClick={() => setI(n)} aria-label={`Show review from ${o.name}`} aria-current={n === current} className="grid h-11 w-8 place-items-center">
                <span className={`h-1.5 rounded-full transition-all ${n === current ? "w-6 bg-ink" : "w-1.5 bg-ink/25"}`} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(current - 1)} aria-label="Previous review" className="grid size-11 place-items-center border border-ink text-ink transition-colors hover:bg-ink hover:text-on-ink active:scale-[0.96] [border-radius:var(--r-btn)]">
              <CaretLeft size={20} />
            </button>
            <button onClick={() => go(current + 1)} aria-label="Next review" className="grid size-11 place-items-center border border-ink text-ink transition-colors hover:bg-ink hover:text-on-ink active:scale-[0.96] [border-radius:var(--r-btn)]">
              <CaretRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
