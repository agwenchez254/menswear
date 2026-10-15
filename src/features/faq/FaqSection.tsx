import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { HOME_FAQ_IDS } from "./faqContent";
import { FaqAccordion } from "./FaqAccordion";
import { useFaqs } from "./useFaqs";

/** The home page's short list of questions. The full list, with search, lives on /faq. */
export function FaqSection() {
  const { items } = useFaqs();
  const [openId, setOpenId] = useState<string | null>(HOME_FAQ_IDS[0]);
  const picked = HOME_FAQ_IDS.map((id) => items.find((i) => i.id === id)).filter((i) => i !== undefined);

  return (
    <section aria-labelledby="home-faq-title" className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="home-faq-title" className="display max-w-[12ch] text-[clamp(2.6rem,5.4vw,4.8rem)]">
            Good to know before you order.
          </h2>
          <p className="mt-5 max-w-[38ch] text-muted">Delivery, payment and receipts, in a few lines each.</p>
          <Link to="/faq" className="btn-dark mt-8">
            See all questions <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
        <FaqAccordion items={picked} openId={openId} onToggle={(id) => setOpenId((cur) => (cur === id ? null : id))} />
      </div>
    </section>
  );
}
