import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { CreditCard, MagnifyingGlass, Package, Receipt, Truck, WhatsappLogo, X } from "@phosphor-icons/react";
import { FAQ_CATEGORIES } from "./faqContent";
import { categoryCounts, filterFaqs } from "./faqLogic";
import { FaqAccordion } from "./FaqAccordion";
import { useFaqs } from "./useFaqs";

const ICONS = { orders: Package, delivery: Truck, payment: CreditCard, account: Receipt } as const;

/** All questions, with a search box and category filters. A link ending in #question-id opens that question. */
export default function FaqPage() {
  const { items, whatsappUrl, whatsappDisplay } = useFaqs();
  const reduce = useReducedMotion();
  const { hash } = useLocation();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const handled = useRef("");

  const shown = useMemo(() => filterFaqs(items, category, query), [items, category, query]);
  const counts = useMemo(() => categoryCounts(items, query), [items, query]);
  // A filter can hide the open question; closing it keeps the page honest.
  const open = shown.some((i) => i.id === openId) ? openId : null;

  useEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    if (!id || handled.current === id || !items.some((i) => i.id === id)) return;
    handled.current = id;
    setCategory("all");
    setQuery("");
    setOpenId(id);
    requestAnimationFrame(() => document.getElementById(`faq-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  }, [hash, items, reduce]);

  const chips = [{ id: "all", label: "All questions" }, ...FAQ_CATEGORIES];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8 md:py-20">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <h1 className="display text-[clamp(2.6rem,6vw,5rem)]">Questions, answered.</h1>
          <p className="mt-4 max-w-[38ch] text-muted">Ordering, delivery, payment and receipts. Search, or pick a topic.</p>

          <div className="relative mt-8">
            <label htmlFor="faq-search" className="sr-only">
              Search the questions
            </label>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search, for example M-Pesa"
              autoComplete="off"
              className="field h-12 w-full pl-11 pr-11"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-ink/10">
                <X size={16} weight="bold" />
              </button>
            )}
          </div>

          <div role="group" aria-label="Topics" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
            {chips.map((c) => {
              const n = counts[c.id] ?? 0;
              const active = category === c.id;
              const Icon = c.id === "all" ? null : ICONS[c.id as keyof typeof ICONS];
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  disabled={n === 0 && !active}
                  onClick={() => setCategory(c.id)}
                  className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap border-l-2 px-4 py-3 text-left text-sm transition-colors duration-200 motion-reduce:transition-none disabled:opacity-40 lg:w-full ${
                    active ? "border-ink bg-ink/5 font-semibold" : "border-transparent hover:bg-ink/5"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {Icon && <Icon size={18} weight={active ? "fill" : "regular"} />}
                    {c.label}
                  </span>
                  <span className="tabular-nums text-muted">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-4 text-sm text-muted" role="status" aria-live="polite">
            {shown.length === 1 ? "1 question" : `${shown.length} questions`}
            {query.trim() ? ` for "${query.trim()}"` : ""}
          </p>

          {shown.length > 0 ? (
            <FaqAccordion items={shown} openId={open} onToggle={(id) => setOpenId((cur) => (cur === id ? null : id))} query={query} />
          ) : (
            <div className="rounded-3xl bg-surface p-8 text-center ring-1 ring-ink/15">
              <p className="display text-3xl">Nothing matches that.</p>
              <p className="mx-auto mt-2 max-w-[40ch] text-muted">Try fewer words, or ask us directly and we will answer on WhatsApp.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" className="btn-ghost" onClick={() => { setQuery(""); setCategory("all"); }}>
                  Clear filters
                </button>
                <a className="btn-dark" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsappLogo size={18} weight="fill" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-on-ink md:p-8">
            <div>
              <p className="display text-2xl md:text-3xl">Still not sure?</p>
              <p className="mt-1 text-sm opacity-80">Message us on {whatsappDisplay} and we will help with your order.</p>
            </div>
            <a className="btn-accent" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo size={18} weight="fill" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
