import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, HandCoins, Package, Phone, Ruler } from "@phosphor-icons/react";
import { byId, categories, formatKES, photo, products, topSelling, type CategorySlug } from "../data/products";
import { zones } from "../data/delivery";
import { Photo } from "../components/Photo";
import { ProductCard } from "../components/ProductCard";
import { GiftUnwrap } from "../components/GiftUnwrap";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);
  const featured = byId("three-piece-wedding-suit")!;

  return (
    <section ref={ref} className="grid min-h-[calc(100dvh-68px)] overflow-hidden lg:grid-cols-[1fr_0.9fr]">
      <div className="flex flex-col justify-center px-4 py-14 md:px-8 lg:py-0 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-12">
        <h1 className="display text-[clamp(2.6rem,5.3vw,5rem)]">
          {["Sharp suits.", "Sent anywhere."].map((line, i) => (
            <span key={line} className="block overflow-hidden whitespace-nowrap pb-[0.08em]">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ ...spring, delay: 0.08 + i * 0.12 }}>
                {i === 1 ? <mark className="bg-accent px-[0.12em] text-accent-ink">{line}</mark> : line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.45 }} className="mt-7 max-w-[44ch] text-lg leading-relaxed text-muted">
          Tailored menswear for Kenyan life, from Nairobi boardrooms to Kisumu weddings. Pay with M-Pesa and get it delivered fast.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.58 }} className="mt-9">
          <Link to="/shop" className="btn-accent group h-14 px-9 text-base">
            Shop menswear <ArrowRight size={18} className="transition group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      <div className="relative min-h-[460px] bg-accent lg:min-h-0">
        <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0 lg:left-[12%]">
          <Photo id={photo.suitGreen} alt="Man adjusting the button of a forest green suit" w={1400} eager position="50% 22%" className="h-full w-full" />
        </motion.div>
        <Link
          to={`/product/${featured.id}`}
          className="group absolute bottom-0 left-0 flex items-center gap-4 bg-surface px-5 py-4 transition hover:bg-ink hover:text-on-ink"
        >
          <span>
            <span className="block text-xs text-muted group-hover:text-on-ink/70">Pictured</span>
            <span className="block font-semibold">{featured.name}</span>
            <span className="block text-sm tabular-nums">{formatKES(featured.price)}</span>
          </span>
          <ArrowUpRight size={22} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

const trust = [
  { icon: Phone, title: "Pay with M-Pesa", text: "STK push to your phone. No card needed." },
  { icon: Package, title: "Delivery nationwide", text: "Same-day in Nairobi, up to 5 days upcountry." },
  { icon: Ruler, title: "Free alterations", text: "Suits hemmed at our CBD studio." },
  { icon: HandCoins, title: "Pay on delivery", text: "Available in Nairobi. Try before you pay." },
];

function Trust() {
  return (
    <section className="border-y border-ink/15 bg-surface">
      <ul className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {trust.map((t) => (
          <li key={t.title} className="flex items-start gap-4 px-4 py-5 md:px-8">
            <t.icon size={26} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{t.title}</p>
              <p className="text-sm text-muted">{t.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Category bento ---------- */

type Place = string;
/**
 * Placement per category. Mobile is a 2-column flow; from lg it is a fixed 4 x 4 bento
 * with no empty cells (9 tiles: 8 categories + 1 call-to-action).
 */
const place: Record<CategorySlug | "all", { cls: Place; pos?: string }> = {
  suits: { cls: "col-span-2 row-span-2 lg:col-start-1 lg:row-start-1", pos: "50% 25%" },
  shirts: { cls: "lg:col-start-3 lg:row-start-1", pos: "50% 30%" },
  kaunda: { cls: "lg:col-start-3 lg:row-start-2", pos: "50% 20%" },
  shoes: { cls: "row-span-2 lg:col-start-4 lg:row-start-1", pos: "50% 50%" },
  trousers: { cls: "row-span-2 lg:col-start-3 lg:row-start-3", pos: "50% 70%" },
  jackets: { cls: "col-span-2 lg:col-start-1 lg:row-start-3", pos: "50% 35%" },
  tshirts: { cls: "lg:col-start-4 lg:row-start-3", pos: "50% 25%" },
  accessories: { cls: "lg:col-start-4 lg:row-start-4", pos: "50% 50%" },
  all: { cls: "col-span-2 lg:col-start-1 lg:row-start-4" },
};
const order: CategorySlug[] = ["suits", "shirts", "kaunda", "shoes", "trousers", "jackets", "tshirts", "accessories"];

function Categories() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <h2 className="display max-w-[16ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">Start with what you need</h2>

      <div className="mt-12 grid auto-rows-[165px] grid-cols-2 gap-2 sm:auto-rows-[210px] md:gap-3 lg:grid-cols-4">
        {order.map((slug, i) => {
          const c = categories.find((x) => x.slug === slug)!;
          const count = products.filter((p) => p.category === slug).length;
          const big = slug === "suits";
          return (
            <motion.div
              key={slug}
              className={place[slug].cls}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...spring, delay: (i % 4) * 0.06 }}
            >
              <Link to={`/shop?cat=${slug}`} className="group relative block h-full overflow-hidden bg-surface-2">
                <Photo
                  id={c.image}
                  alt={`${c.label} collection`}
                  w={big ? 1100 : 700}
                  position={place[slug].pos}
                  className="absolute inset-0 grayscale-[0.55] transition duration-700 ease-out group-hover:scale-[1.06] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0d]/80 via-[#0d0f0d]/10 to-transparent" />
                <span className="absolute left-0 top-0 bg-accent px-2.5 py-1 text-xs font-bold tabular-nums text-accent-ink">{count}</span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-[#eceee8] md:p-5">
                  <div>
                    <p className={`display ${big ? "text-[clamp(2rem,3.6vw,3.4rem)]" : "text-[clamp(1.35rem,2vw,1.9rem)]"}`}>{c.label}</p>
                    {(big || slug === "jackets") && <p className="mt-2 hidden text-sm text-[#eceee8]/80 sm:block">{c.tag}</p>}
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center bg-[#eceee8] text-[#0d0f0d] transition group-hover:bg-accent">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}

        <motion.div
          className={place.all.cls}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={spring}
        >
          <Link to="/shop" className="group flex h-full flex-col justify-between bg-accent p-5 text-accent-ink transition hover:bg-ink hover:text-on-ink md:p-6">
            <span className="display text-[clamp(1.6rem,2.6vw,2.4rem)]">Browse all {products.length} pieces</span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              Open the full shop <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Top selling (1 feature + 4) ---------- */

function TopSelling() {
  const [lead, ...rest] = topSelling;
  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display max-w-[14ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">What Nairobi is wearing</h2>
          <Link to="/shop?sort=best" className="btn-ghost">
            See all bestsellers
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 lg:grid-cols-4">
          <motion.div
            className="col-span-2 lg:row-span-2"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={spring}
          >
            <Link to={`/product/${lead.id}`} className="group relative block h-full min-h-[460px] overflow-hidden bg-surface-2">
              <Photo id={lead.images[0]} alt={lead.name} w={1100} position="50% 25%" className="absolute inset-0 transition duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0d]/80 via-transparent to-transparent" />
              <span className="absolute left-0 top-0 bg-ink px-3 py-1.5 text-sm font-semibold text-on-ink">Best seller this month</span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-[#eceee8] md:p-7">
                <div>
                  <p className="display text-[clamp(1.8rem,3vw,2.8rem)]">{lead.name}</p>
                  <p className="mt-2 tabular-nums">{formatKES(lead.price)}</p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center bg-accent text-accent-ink transition group-hover:bg-[#eceee8]">
                  <ArrowUpRight size={22} />
                </span>
              </div>
            </Link>
          </motion.div>
          {rest.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Gift ---------- */

function GiftTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const p = byId("oxford-button-down")!;
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <h2 className="display max-w-[12ch] text-[clamp(2.6rem,6vw,5.4rem)]">Some gifts deserve a reveal.</h2>
          <p className="mt-6 max-w-[46ch] text-lg text-muted">Pick the piece, choose the box, write the card. Your recipient opens it with a small ceremony, right on their phone.</p>
          <Link to="/gift" className="btn-accent group mt-8 h-14 px-9 text-base">
            Build a gift <ArrowRight size={18} className="transition group-hover:translate-x-1" />
          </Link>
        </div>
        <div ref={ref} className="min-h-[520px]">
          {inView && <GiftUnwrap product={p} color="White" wrap="forest" ribbon="gold" message="Congratulations on the new job. Wear it well." from="Wanjiru" to="Baba" runKey={1} />}
        </div>
      </div>
    </section>
  );
}

/* ---------- Delivery band ---------- */

function Delivery() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0d0f0d] text-[#eceee8]">
      <Photo id={photo.nairobiSkyline} alt="Nairobi skyline at dusk reflected in water" w={1800} className="absolute inset-0 -z-10 opacity-50" position="50% 55%" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d0f0d] via-[#0d0f0d]/70 to-transparent" />
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <h2 className="display max-w-[14ch] text-[clamp(2.6rem,6vw,5.4rem)]">Delivered to every county.</h2>
        <dl className="mt-14 grid max-w-3xl gap-x-10 gap-y-8 sm:grid-cols-2">
          {zones.map((z) => (
            <div key={z.id} className="border-t border-[#eceee8]/30 pt-4">
              <dt className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">{z.label}</span>
                <span className="tabular-nums text-accent">{formatKES(z.fee)}</span>
              </dt>
              <dd className="mt-1 text-sm text-[#eceee8]/70">{z.eta}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-sm text-[#eceee8]/70">Free delivery in Nairobi on orders above KES 10,000.</p>
      </div>
    </section>
  );
}

/* ---------- Reviews ---------- */

function Reviews() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <h2 className="display max-w-[12ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">Worn and approved</h2>
      <div className="mt-14 grid gap-14 lg:grid-cols-12">
        <figure className="lg:col-span-7">
          <blockquote className="display text-[clamp(1.7rem,3.2vw,2.8rem)] leading-[1.08]">
            &ldquo;Ordered the charcoal suit on Tuesday for my brother&rsquo;s wedding. It reached Machakos on Thursday and fit perfectly.&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-sm">
            <span className="block font-semibold">Kelvin Mutiso</span>
            <span className="text-muted">Machakos</span>
          </figcaption>
        </figure>
        <div className="space-y-12 lg:col-span-4 lg:col-start-9 lg:pt-16">
          {[
            { q: "The gift box opening on his phone had my husband grinning before he touched the shirt.", n: "Achieng’ Odhiambo", w: "Kisumu" },
            { q: "Paid by M-Pesa in under a minute. The Oxfords came boxed and polished.", n: "Mwangi Gathogo", w: "Kilimani, Nairobi" },
          ].map((r) => (
            <figure key={r.n}>
              <blockquote className="text-xl leading-snug">&ldquo;{r.q}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="block font-semibold">{r.n}</span>
                <span className="text-muted">{r.w}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Trust />
      <Categories />
      <TopSelling />
      <GiftTeaser />
      <Delivery />
      <Reviews />
    </>
  );
}
