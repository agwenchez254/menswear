import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { isMuted, setMuted } from "@/lib/chime";
import { useAppSelector } from "@/store/hooks";
import { orderPath } from "@/config/routes";
import { useNotices } from "./store";

const ago = (at: number): string => {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86_400)} d ago`;
};

/** Bell in the header with the customer's recent order updates. Only shown while signed in. */
export function NotificationBell() {
  const signedIn = useAppSelector((s) => !!s.auth.accessToken);
  const notices = useNotices((s) => s.notices);
  const markAllRead = useNotices((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const box = useRef<HTMLDivElement>(null);
  const unread = notices.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!signedIn) return null;

  return (
    <div ref={box} className="relative">
      <button
        className="relative grid size-11 place-items-center hover:bg-ink/5"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
      >
        <Bell size={22} weight={unread ? "fill" : "regular"} />
        {unread > 0 && <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center bg-accent px-1 text-[11px] font-bold leading-[18px] text-accent-ink [border-radius:var(--r-soft)]">{unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-full z-50 mt-1 w-[min(92vw,22rem)] rounded-2xl bg-paper p-2 shadow-2xl ring-1 ring-ink/15">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="font-semibold">Order updates</p>
            <button
              className="grid size-9 place-items-center hover:bg-ink/5"
              aria-label={muted ? "Turn notification sound on" : "Turn notification sound off"}
              onClick={() => {
                setMuted(!muted);
                setMutedState(!muted);
              }}
            >
              {muted ? <SpeakerSlash size={18} /> : <SpeakerHigh size={18} />}
            </button>
          </div>
          {notices.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">Nothing yet. Updates about your orders show up here as they happen.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link to={orderPath(n.number)} onClick={() => setOpen(false)} className="block px-2 py-3 hover:bg-ink/5">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">{ago(n.at)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
