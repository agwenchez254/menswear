import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, HandCoins, Package, Phone, Ruler } from "@phosphor-icons/react";
import { byId, categoriesByGender, formatKES, photo, productsFor, topSellingFor, type CategorySlug, type Gender } from "../data/products";
import { zones } from "../data/delivery";
import { useGender } from "../store/gender";
import { Photo } from "../components/Photo";
import { ProductCard } from "../components/ProductCard";
import { GiftUnwrap } from "../components/GiftUnwrap";
import { LinesReveal, Magnetic, Parallax, Reveal, VelocityMarquee, Wipe, ZoomOut } from "../components/motion";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

/* ---------- Copy and layout per gender ---------- */

interface Cfg {
  hero: { lines: [string, string]; sub: string; cta: string; image: string; alt: string; pos: string; featured: string };
  trust: { icon: typeof Phone; title: string; text: string }[];
  catTitle: string;
  topTitle: string;
  gift: { productId: string; color: string; wrap: string; ribbon: string; message: string; from: string; to: string };
  reviews: { lead: { q: string; n: string; w: string }; others: { q: string; n: string; w: string }[] };
  /** Category order matches the DOM order (mobile flow); `cls` places each tile on the lg grid. */
  grid: { rows: string; order: CategorySlug[]; place: Record<string, { cls: string; pos?: string }> };
}

const trustMen = [
  { icon: Phone, title: "Pay with M-Pesa", text: "STK push to your phone. No card needed." },
  { icon: Package, title: "Delivery nationwide", text: "Same-day in Nairobi, up to 5 days upcountry." },
  { icon: Ruler, title: "Free alterations", text: "Suits hemmed at our CBD studio." },
  { icon: HandCoins, title: "Pay on delivery", text: "Available in Nairobi. Try before you pay." },
];
const trustWomen = [
  { icon: Phone, title: "Pay with M-Pesa", text: "STK push to your phone. No card needed." },
  { icon: Package, title: "Delivery nationwide", text: "Same-day in Nairobi, up to 5 days upcountry." },
  { icon: Ruler, title: "Free hemming", text: "Dresses and trousers adjusted at our studio." },
  { icon: HandCoins, title: "Pay on delivery", text: "Available in Nairobi. Try before you pay." },
];

const cfg: Record<Gender, Cfg> = {
  men: {
    hero: {
      lines: ["Sharp suits.", "Sent anywhere."],
      sub: "Tailored menswear for Kenyan life, from Nairobi boardrooms to Kisumu weddings. Pay with M-Pesa and get it delivered fast.",
      cta: "Shop menswear",
      image: photo.suitGreen,
      alt: "Man adjusting the button of a forest green suit",
      pos: "50% 22%",
      featured: "three-piece-wedding-suit",
    },
    trust: trustMen,
    catTitle: "Start with what you need",
    topTitle: "What Nairobi is wearing",
    gift: { productId: "oxford-button-down", color: "White", wrap: "forest", ribbon: "gold", message: "Congratulations on the new job. Wear it well.", from: "Wanjiru", to: "Baba" },
    reviews: {
      lead: { q: "Ordered the charcoal suit on Tuesday for my brother’s wedding. It reached Machakos on Thursday and fit perfectly.", n: "Kelvin Mutiso", w: "Machakos" },
      others: [
        { q: "The gift box opening on his phone had my husband grinning before he touched the shirt.", n: "Achieng’ Odhiambo", w: "Kisumu" },
        { q: "Paid by M-Pesa in under a minute. The Oxfords came boxed and polished.", n: "Mwangi Gathogo", w: "Kilimani, Nairobi" },
        { q: "Sizing guide was spot on. The Kaunda suit needed no alterations before the ceremony.", n: "Otieno Ouma", w: "Kakamega" },
        { q: "Wrapped, carded and delivered to my dad in Nyeri the next day. He kept the box.", n: "Brian Kiprop", w: "Nyeri" },
        { q: "Third order now. The shirts hold their shape wash after wash.", n: "Hassan Abdi", w: "Eastleigh, Nairobi" },
      ],
    },
    grid: {
      rows: "lg:grid-rows-4",
      order: ["suits", "shirts", "kaunda", "shoes", "trousers", "jackets", "tshirts", "accessories"],
      place: {
        suits: { cls: "col-span-2 row-span-2 lg:col-start-1 lg:row-start-1", pos: "50% 25%" },
        shirts: { cls: "lg:col-start-3 lg:row-start-1", pos: "50% 30%" },
        kaunda: { cls: "lg:col-start-3 lg:row-start-2", pos: "50% 20%" },
        shoes: { cls: "row-span-2 lg:col-start-4 lg:row-start-1", pos: "50% 50%" },
        trousers: { cls: "row-span-2 lg:col-start-3 lg:row-start-3", pos: "50% 70%" },
        jackets: { cls: "col-span-2 lg:col-start-1 lg:row-start-3", pos: "50% 35%" },
        tshirts: { cls: "lg:col-start-4 lg:row-start-3", pos: "50% 25%" },
        accessories: { cls: "lg:col-start-4 lg:row-start-4", pos: "50% 50%" },
        all: { cls: "col-span-2 lg:col-start-1 lg:row-start-4" },
      },
    },
  },
  women: {
    hero: {
      lines: ["Wear what", "feels like you."],
      sub: "Dresses, tailoring and everyday basics for Kenyan women. Pay with M-Pesa and get it delivered to your door.",
      cta: "Shop womenswear",
      image: photo.wRedFloral,
      alt: "Woman smiling in a red floral dress against a warm yellow wall",
      pos: "50% 30%",
      featured: "floral-wrap-dress",
    },
    trust: trustWomen,
    catTitle: "Find your next favourite",
    topTitle: "What Nairobi is loving",
    gift: { productId: "denim-shirt-dress", color: "Denim", wrap: "midnight", ribbon: "cream", message: "Happy birthday, mama. You deserve something lovely.", from: "Njeri", to: "Mama" },
    reviews: {
      lead: { q: "The denim shirt dress reached Eldoret in two days and fits like it was made for me.", n: "Naliaka Wekesa", w: "Eldoret" },
      others: [
        { q: "I paid by M-Pesa from my desk. The coat was at my door by Friday.", n: "Zawadi Mwikali", w: "Mombasa" },
        { q: "The gift reveal made my sister cry on a video call, in the best way.", n: "Amina Said", w: "South B, Nairobi" },
        { q: "Bought two dresses for a family trip. Both arrived pressed and perfectly packed.", n: "Cynthia Chebet", w: "Nakuru" },
        { q: "Customer care answered on WhatsApp within minutes and sorted my exchange.", n: "Faith Njoroge", w: "Thika" },
        { q: "The knitwear is softer than anything I have found in town. Already ordered another.", n: "Lilian Atieno", w: "Kisii" },
      ],
    },
    grid: {
      rows: "lg:grid-rows-3",
      order: ["dresses", "tops", "knitwear", "jackets", "trousers", "shoes", "accessories"],
      place: {
        dresses: { cls: "col-span-2 row-span-2 lg:col-start-1 lg:row-start-1", pos: "50% 30%" },
        tops: { cls: "lg:col-start-3 lg:row-start-1", pos: "50% 40%" },
        knitwear: { cls: "lg:col-start-3 lg:row-start-2", pos: "50% 30%" },
        jackets: { cls: "col-span-2 lg:col-span-1 lg:row-span-2 lg:col-start-4 lg:row-start-1", pos: "50% 30%" },
        trousers: { cls: "lg:col-start-1 lg:row-start-3", pos: "50% 45%" },
        shoes: { cls: "lg:col-start-2 lg:row-start-3", pos: "50% 55%" },
        accessories: { cls: "lg:col-start-3 lg:row-start-3", pos: "50% 50%" },
        all: { cls: "lg:col-start-4 lg:row-start-3" },
      },
    },
  },
};

/* ---------- Hero ---------- */

function Hero({ g }: { g: Gender }) {
  const c = cfg[g].hero;
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-12%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);
  const featured = byId(c.featured)!;
  const women = g === "women";

  const text = (
    <motion.div style={{ y: textY, opacity: fade }} className={`flex flex-col justify-center px-4 py-14 md:px-8 lg:py-0 ${women ? "lg:pl-14 lg:pr-[max(2rem,calc((100vw-1400px)/2+2rem))]" : "lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-12"}`}>
      <h1 className="display text-[clamp(2.6rem,5.6vw,5.2rem)]">
        {c.lines.map((line, i) => (
          <span key={line} className="block overflow-hidden whitespace-nowrap pb-[0.1em]">
            <motion.span className="block" initial={{ y: "108%" }} animate={{ y: 0 }} transition={{ ...spring, delay: 0.08 + i * 0.12 }}>
              {i === 1 ? <Wipe>{line}</Wipe> : line}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.45 }} className="mt-7 max-w-[44ch] text-lg leading-relaxed text-muted">
        {c.sub}
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.58 }} className="mt-9">
        <Magnetic>
          <Link to="/shop" className="btn-accent group h-14 px-9 text-base">
            {c.cta} <ArrowRight size={18} className="transition group-hover:translate-x-1" />
          </Link>
        </Magnetic>
      </motion.div>
    </motion.div>
  );

  const hotspot = (
    <Link
      to={`/product/${featured.id}`}
      className="group absolute bottom-0 left-0 z-10 flex items-center gap-4 bg-surface px-5 py-4 transition hover:bg-ink hover:text-on-ink [border-radius:0_var(--r-tile)_0_0]"
    >
      <span>
        <span className="block text-xs text-muted group-hover:text-on-ink/70">Pictured</span>
        <span className="block font-semibold">{featured.name}</span>
        <span className="block text-sm tabular-nums">{formatKES(featured.price)}</span>
      </span>
      <ArrowUpRight size={22} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );

  const image = women ? (
    /* Women: the photo sits in an arch on a soft stage, mirrored to the left. */
    <div className="relative min-h-[520px] overflow-hidden bg-accent/30 lg:order-first lg:min-h-0">
      <motion.div
        initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
        animate={{ clipPath: "inset(0% 0 0 0)" }}
        transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-x-[9%] bottom-0 top-[7%] overflow-hidden [border-radius:999px_999px_0_0]"
      >
        <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0">
          <Photo id={c.image} alt={c.alt} w={1200} eager position={c.pos} className="h-full w-full" />
        </motion.div>
      </motion.div>
      {hotspot}
    </div>
  ) : (
    <div className="relative min-h-[460px] bg-accent lg:min-h-0">
      <motion.div
        initial={reduce ? false : { clipPath: "inset(0 0 0 100%)" }}
        animate={{ clipPath: "inset(0 0 0 0%)" }}
        transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-0"
      >
        <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0 lg:left-[12%]">
          <Photo id={c.image} alt={c.alt} w={1400} eager position={c.pos} className="h-full w-full" />
        </motion.div>
      </motion.div>
      {hotspot}
    </div>
  );

  return (
    <section ref={ref} className={`grid min-h-[calc(100dvh-68px)] overflow-hidden ${women ? "lg:grid-cols-[0.9fr_1fr]" : "lg:grid-cols-[1fr_0.9fr]"}`}>
      {text}
      {image}
    </section>
  );
}

function Trust({ g }: { g: Gender }) {
  return (
    <section className="border-y border-ink/15 bg-surface">
      <ul className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {cfg[g].trust.map((t, i) => (
          <li key={t.title}>
            <Reveal delay={i * 0.06} y={14} className="flex items-start gap-4 px-4 py-5 md:px-8">
              <t.icon size={26} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-sm text-muted">{t.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Category bento ---------- */

function Categories({ g }: { g: Gender }) {
  const c = cfg[g];
  const cats = categoriesByGender[g];
  const all = productsFor(g);
  const first = c.grid.order[0];
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <LinesReveal lines={[c.catTitle]} className="display max-w-[16ch] text-[clamp(2.4rem,5.2vw,4.6rem)]" />

      <div className={`mt-12 grid auto-rows-[165px] grid-cols-2 gap-2 sm:auto-rows-[210px] md:gap-3 lg:grid-cols-4 ${c.grid.rows}`}>
        {c.grid.order.map((slug, i) => {
          const cat = cats.find((x) => x.slug === slug)!;
          const count = all.filter((p) => p.category === slug).length;
          const big = slug === first;
          return (
            <motion.div
              key={slug}
              className={c.grid.place[slug].cls}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...spring, delay: (i % 4) * 0.06 }}
            >
              <Link to={`/shop?cat=${slug}`} className="tile group relative block h-full bg-surface-2">
                <Parallax amount={6}>
                  <Photo id={cat.image} alt={`${cat.label} collection`} w={big ? 1100 : 700} position={c.grid.place[slug].pos} className="h-full w-full grayscale-[0.55] transition duration-700 ease-out group-hover:scale-[1.05] group-hover:grayscale-0" />
                </Parallax>
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
            </motion.div>
          );
        })}

        <motion.div
          className={c.grid.place.all.cls}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={spring}
        >
          <Link to="/shop" className="tile group flex h-full flex-col justify-between bg-accent p-5 text-accent-ink transition hover:bg-ink hover:text-on-ink md:p-6">
            <span className="display text-[clamp(1.6rem,2.6vw,2.4rem)]">Browse all {all.length} pieces</span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              Open the full shop <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Marquee (the page's only one): category links, speed follows scroll velocity ---------- */

function CategoryBand({ g }: { g: Gender }) {
  const items = categoriesByGender[g].map((c) => ({ label: c.label, to: `/shop?cat=${c.slug}` }));
  return <VelocityMarquee items={items} />;
}

/* ---------- Top selling (1 feature + 4) ---------- */

function TopSelling({ g }: { g: Gender }) {
  const [lead, ...rest] = topSellingFor(g);
  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <LinesReveal lines={[cfg[g].topTitle]} className="display max-w-[14ch] text-[clamp(2.4rem,5.2vw,4.6rem)]" />
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
            <Link to={`/product/${lead.id}`} className="tile group relative block h-full min-h-[460px] bg-surface-2">
              <ZoomOut>
                <Photo id={lead.images[0]} alt={lead.name} w={1100} position="50% 25%" className="h-full w-full" />
              </ZoomOut>
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

function GiftTeaser({ g }: { g: Gender }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const c = cfg[g].gift;
  const p = byId(c.productId)!;
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <LinesReveal lines={["Some gifts", "deserve a reveal."]} className="display max-w-[12ch] text-[clamp(2.6rem,6vw,5.4rem)]" />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-[46ch] text-lg text-muted">Pick the piece, choose the box, write the card. Your recipient opens it with a small ceremony, right on their phone.</p>
            <Magnetic className="mt-8">
              <Link to="/gift" className="btn-accent group h-14 px-9 text-base">
                Build a gift <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
            </Magnetic>
          </Reveal>
        </div>
        <div ref={ref} className="min-h-[520px]">
          {inView && <GiftUnwrap key={g} product={p} color={c.color} wrap={c.wrap} ribbon={c.ribbon} message={c.message} from={c.from} to={c.to} runKey={1} />}
        </div>
      </div>
    </section>
  );
}

/* ---------- Delivery band ---------- */

function Delivery() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0d0f0d] text-[#eceee8]">
      <ZoomOut from={1.25} className="-z-10 opacity-50">
        <Photo id={photo.nairobiSkyline} alt="Nairobi skyline at dusk reflected in water" w={1800} className="h-full w-full" position="50% 55%" />
      </ZoomOut>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d0f0d] via-[#0d0f0d]/70 to-transparent" />
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <LinesReveal lines={["Delivered to", "every county."]} className="display max-w-[14ch] text-[clamp(2.6rem,6vw,5.4rem)]" />
        <dl className="mt-14 grid max-w-3xl gap-x-10 gap-y-8 sm:grid-cols-2">
          {zones.map((z, i) => (
            <Reveal key={z.id} delay={i * 0.07} y={16} className="border-t border-[#eceee8]/30 pt-4">
              <dt className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">{z.label}</span>
                <span className="tabular-nums text-accent">{formatKES(z.fee)}</span>
              </dt>
              <dd className="mt-1 text-sm text-[#eceee8]/70">{z.eta}</dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-10 text-sm text-[#eceee8]/70">Free delivery in Nairobi on orders above KES 10,000.</p>
      </div>
    </section>
  );
}

/* ---------- Reviews ---------- */

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-ink">
      {initials}
    </span>
  );
}

function Reviews({ g }: { g: Gender }) {
  const { lead, others } = cfg[g].reviews;
  const items = [lead, ...others];
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setI(0), [g]);
  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [paused, reduce, items.length]);

  const r = items[i];
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <LinesReveal lines={[g === "men" ? "Worn and approved" : "Loved and worn"]} className="display max-w-[12ch] text-[clamp(2.4rem,5.2vw,4.6rem)]" />
      <div
        className="mt-14 max-w-4xl"
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer reviews"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="min-h-[15rem] md:min-h-[13rem]" aria-live={paused ? "polite" : "off"}>
          <AnimatePresence mode="wait">
            <motion.figure key={r.n} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
              <blockquote className="display text-[clamp(1.5rem,3vw,2.6rem)] leading-[1.1]">&ldquo;{r.q}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-sm">
                <Avatar name={r.n} />
                <span>
                  <span className="block font-semibold">{r.n}</span>
                  <span className="text-muted">{r.w}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex items-center gap-1">
          {items.map((o, n) => (
            <button key={o.n} onClick={() => setI(n)} aria-label={`Show review from ${o.n}`} aria-current={n === i} className="grid h-11 w-8 place-items-center">
              <span className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-ink" : "w-1.5 bg-ink/25"}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const g = useGender((s) => s.gender);
  return (
    <>
      <Hero key={`hero-${g}`} g={g} />
      <Trust g={g} />
      <Categories key={`cat-${g}`} g={g} />
      <TopSelling key={`top-${g}`} g={g} />
      <CategoryBand g={g} />
      <GiftTeaser g={g} />
      <Delivery />
      <Reviews key={`rev-${g}`} g={g} />
    </>
  );
}
