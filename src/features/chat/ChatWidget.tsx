import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowCounterClockwise, ChatCircleDots, PaperPlaneRight, WhatsappLogo, X } from "@phosphor-icons/react";
import { useSendChatMutation, type ChatTurn } from "@/api/chat";
import { useSiteSettings } from "@/api/settings";
import { parseMessage, type Inline } from "@/lib/chatText";

const KEY = "jabali-chat";
const MAX_CHARS = 1000;
const STARTERS = ["How long does delivery take?", "How do I pay with M-Pesa?", "Help me find a gift", "How do I track my order?"];
const GREETING = "Hi, I'm Jabali's shopping assistant. Ask me about products, sizes, delivery, payments, gifts or an order.";

interface Saved {
  turns: ChatTurn[];
  suggestions: string[];
}

function load(): Saved {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Saved;
      if (Array.isArray(v.turns)) return { turns: v.turns.slice(-30), suggestions: Array.isArray(v.suggestions) ? v.suggestions : [] };
    }
  } catch {
    /* storage unavailable: the chat just starts fresh */
  }
  return { turns: [], suggestions: [] };
}

function Inlines({ parts, onNavigate }: { parts: Inline[]; onNavigate: () => void }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "bold") return <strong key={i}>{p.text}</strong>;
        if (p.kind === "text") return <span key={i}>{p.text}</span>;
        return p.href.startsWith("/") ? (
          <Link key={i} to={p.href} onClick={onNavigate} className="font-medium underline underline-offset-2">
            {p.text}
          </Link>
        ) : (
          <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
            {p.text}
          </a>
        );
      })}
    </>
  );
}

function Message({ turn, onNavigate }: { turn: ChatTurn; onNavigate: () => void }) {
  const mine = turn.role === "user";
  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2 px-3.5 py-2.5 text-sm leading-relaxed [border-radius:var(--r-soft)] ${mine ? "bg-ink text-on-ink" : "bg-surface-2 text-ink"}`}>
        {mine ? (
          <p className="whitespace-pre-wrap break-words">{turn.content}</p>
        ) : (
          parseMessage(turn.content).map((b, i) =>
            b.kind === "list" ? (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inlines parts={it} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            ) : (
              <p key={i} className="break-words">
                <Inlines parts={b.inline} onNavigate={onNavigate} />
              </p>
            ),
          )
        )}
      </div>
    </li>
  );
}

/** Floating shopping assistant. Answers FAQs and product questions; the page it is on is sent along for context. */
export function ChatWidget() {
  const { pathname } = useLocation();
  const { whatsappDigits } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Saved>(load);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [send, { isLoading }] = useSendChatMutation();
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      /* storage unavailable */
    }
  }, [saved]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [saved.turns.length, isLoading, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (question: string) => {
    const q = question.trim().slice(0, MAX_CHARS);
    if (!q || isLoading) return;
    setError("");
    setText("");
    const turns: ChatTurn[] = [...saved.turns, { role: "user", content: q }];
    setSaved({ turns, suggestions: [] });
    try {
      const r = await send({ messages: turns.slice(-20), path: pathname }).unwrap();
      setSaved({ turns: [...turns, { role: "assistant", content: r.reply }], suggestions: r.suggestions });
    } catch (e) {
      const status = (e as { status?: number }).status;
      setError(status === 429 ? "You are sending messages quickly. Please wait a moment and try again." : "I could not reach the assistant. Please try again, or chat to us on WhatsApp.");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(text);
  };

  const reset = () => {
    setSaved({ turns: [], suggestions: [] });
    setError("");
    input.current?.focus();
  };

  return (
    <>
      <button
        ref={launcher}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close the shopping assistant" : "Open the shopping assistant"}
        className="fixed bottom-4 right-4 z-40 grid size-14 place-items-center bg-ink text-on-ink shadow-xl transition active:scale-95 [border-radius:var(--r-soft)] hover:bg-accent hover:text-accent-ink"
      >
        {open ? <X size={26} /> : <ChatCircleDots size={28} weight="fill" />}
      </button>

      {open && (
        <section
          id="chat-panel"
          role="dialog"
          aria-label="Jabali shopping assistant"
          className="fixed inset-x-2 bottom-20 z-[55] flex max-h-[min(34rem,calc(100dvh-6rem))] flex-col overflow-hidden bg-paper shadow-2xl ring-1 ring-ink/15 sm:inset-x-auto sm:right-4 sm:w-[24rem] [border-radius:var(--r-tile)]"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Jabali assistant</h2>
              <p className="text-xs text-muted">Automated help. Don't share card numbers or PINs.</p>
            </div>
            <div className="-mr-2 flex items-center">
              <button type="button" onClick={reset} aria-label="Start a new chat" className="grid size-9 place-items-center hover:bg-ink/5">
                <ArrowCounterClockwise size={18} />
              </button>
              <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" aria-label="Chat to a person on WhatsApp" className="grid size-9 place-items-center hover:bg-ink/5">
                <WhatsappLogo size={20} weight="fill" />
              </a>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 place-items-center hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-3" aria-live="polite" aria-label="Conversation">
              <Message turn={{ role: "assistant", content: GREETING }} onNavigate={() => setOpen(false)} />
              {saved.turns.map((t, i) => (
                <Message key={i} turn={t} onNavigate={() => setOpen(false)} />
              ))}
              {isLoading && (
                <li className="flex" aria-label="The assistant is typing">
                  <div className="flex gap-1 bg-surface-2 px-3.5 py-3 [border-radius:var(--r-soft)]">
                    <span className="size-1.5 animate-pulse rounded-full bg-ink/50" />
                    <span className="size-1.5 animate-pulse rounded-full bg-ink/50 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-ink/50 [animation-delay:300ms]" />
                  </div>
                </li>
              )}
            </ul>
            {error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
            {!isLoading && (saved.turns.length === 0 || saved.suggestions.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(saved.turns.length === 0 ? STARTERS : saved.suggestions).map((s) => (
                  <button key={s} type="button" onClick={() => void ask(s)} className="border border-line bg-surface px-3 py-1.5 text-left text-xs hover:border-ink [border-radius:var(--r-soft)]">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={submit} className="flex items-end gap-2 border-t border-line p-3">
            <label htmlFor="chat-input" className="sr-only">
              Your message
            </label>
            <textarea
              id="chat-input"
              ref={input}
              rows={1}
              maxLength={MAX_CHARS}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(text);
                }
              }}
              placeholder="Ask about products, delivery, payments..."
              className="field max-h-28 min-h-11 flex-1 resize-none py-2.5 text-sm"
            />
            <button type="submit" disabled={isLoading || !text.trim()} aria-label="Send" className="btn-accent size-11 min-h-11 shrink-0 px-0 disabled:opacity-50">
              <PaperPlaneRight size={20} weight="fill" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
