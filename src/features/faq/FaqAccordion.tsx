import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { highlightParts, type FaqItem } from "./faqLogic";

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded-sm bg-accent px-0.5 text-accent-ink">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

interface Props {
  items: FaqItem[];
  /** The open question, or null when all are closed. One is open at a time. */
  openId: string | null;
  onToggle: (id: string) => void;
  /** Search words to mark in the questions and answers. */
  query?: string;
}

/**
 * Accordion cards. Each question is a real button (aria-expanded) so it works with keyboard and screen readers.
 * The answer slides open by animating grid rows, which needs no measuring, and it stays out of the tab order while closed.
 */
export function FaqAccordion({ items, openId, onToggle, query = "" }: Props) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const open = item.id === openId;
        const buttonId = `faq-q-${item.id}`;
        const panelId = `faq-a-${item.id}`;
        return (
          <li
            key={item.id}
            id={`faq-${item.id}`}
            className={`scroll-mt-28 rounded-3xl ring-1 transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none ${
              open ? "bg-surface shadow-[inset_4px_0_0_var(--accent)] ring-ink" : "bg-transparent ring-ink/15 hover:ring-ink/40"
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => onToggle(item.id)}
                className="flex w-full items-center justify-between gap-4 rounded-3xl px-5 py-5 text-left active:scale-[0.995] md:px-7 md:py-6"
              >
                <span className="text-base font-semibold md:text-lg">
                  <Marked text={item.question} query={query} />
                </span>
                <span
                  aria-hidden
                  className={`grid size-9 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-300 motion-reduce:transition-none ${
                    open ? "rotate-45 bg-ink text-on-ink" : "bg-accent text-accent-ink"
                  }`}
                >
                  <Plus size={18} weight="bold" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-6 md:px-7">
                  <p className="max-w-[62ch] leading-relaxed text-muted">
                    <Marked text={item.answer} query={query} />
                  </p>
                  {item.links && item.links.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      {item.links.map((l) => (
                        <Link key={l.to} to={l.to} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 hover:text-muted">
                          {l.label} <ArrowRight size={14} weight="bold" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
