import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { orderPath } from "@/config/routes";
import { useNotices } from "./store";

const SHOW_MS = 7000;

const ICON = { success: CheckCircle, info: Info, alert: WarningCircle } as const;

/** Pop-ups for fresh order updates, bottom right. Each closes itself after a few seconds. */
export function NoticeToasts() {
  const notices = useNotices((s) => s.notices);
  const popups = useNotices((s) => s.popups);
  const dismiss = useNotices((s) => s.dismiss);
  const shown = popups.map((id) => notices.find((n) => n.id === id)).filter((n) => !!n);

  useEffect(() => {
    const timers = popups.map((id) => setTimeout(() => dismiss(id), SHOW_MS));
    return () => timers.forEach(clearTimeout);
  }, [popups, dismiss]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,22rem)] flex-col gap-2" role="region" aria-label="Order updates" aria-live="polite">
      <AnimatePresence>
        {shown.map((n) => {
          const Icon = ICON[n.tone];
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto relative flex gap-3 rounded-2xl bg-paper p-4 pr-10 shadow-2xl ring-1 ring-ink/15"
            >
              <Icon size={24} weight="fill" className={n.tone === "alert" ? "shrink-0 text-danger" : n.tone === "success" ? "shrink-0 text-mpesa" : "shrink-0 text-ink"} />
              <Link to={orderPath(n.number)} onClick={() => dismiss(n.id)} className="min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-muted">{n.body}</p>
              </Link>
              <button className="absolute right-1 top-1 grid size-9 place-items-center text-muted hover:text-ink" onClick={() => dismiss(n.id)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
