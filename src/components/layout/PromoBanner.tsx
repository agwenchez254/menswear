import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "@phosphor-icons/react";
import { useSiteSettings } from "@/api/settings";

const KEY = "promo-dismissed";

function dismissedText() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Admin-managed promotion strip above the header, with an optional call-to-action link. */
export function PromoBanner() {
  const { promotion } = useSiteSettings();
  const [dismissed, setDismissed] = useState(dismissedText);
  if (!promotion || dismissed === promotion.text) return null;

  const close = () => {
    setDismissed(promotion.text);
    try {
      sessionStorage.setItem(KEY, promotion.text);
    } catch {
      /* private mode: it just returns on reload */
    }
  };
  const { link, linkLabel } = promotion;
  const cls = "inline-flex items-center gap-1 font-semibold underline underline-offset-4";
  const label = (
    <>
      {linkLabel} <ArrowRight size={14} weight="bold" aria-hidden="true" />
    </>
  );

  return (
    <div role="region" aria-label="Promotion" className="relative bg-ink text-on-ink">
      <div className="mx-auto flex min-h-10 max-w-[1400px] flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 pl-4 pr-12 text-center text-sm">
        <p>{promotion.text}</p>
        {link &&
          (/^https?:\/\//i.test(link) ? (
            <a href={link} className={cls}>
              {label}
            </a>
          ) : (
            <Link to={link.startsWith("/") ? link : `/${link}`} className={cls}>
              {label}
            </Link>
          ))}
      </div>
      <button type="button" onClick={close} aria-label="Dismiss promotion" className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
}
