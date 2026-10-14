import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Gift, Minus, Plus, ShoppingBag, Trash, X } from "@phosphor-icons/react";
import { cartSubtotal, lineTotal, useCart } from "../store/cart";
import { byId, formatKES } from "../data/products";
import { Photo } from "./Photo";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove } = useCart();
  const subtotal = cartSubtotal(lines);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-paper shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="display text-2xl">Your bag</h2>
              <button className="grid size-11 place-items-center hover:bg-ink/5" onClick={() => setOpen(false)} aria-label="Close bag">
                <X size={22} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="grid size-16 place-items-center bg-ink/5">
                  <ShoppingBag size={28} />
                </div>
                <p className="display text-2xl">Nothing here yet</p>
                <p className="max-w-[28ch] text-sm text-muted">Start with something to wear this week, or send a gift to someone who deserves it.</p>
                <Link to="/shop" onClick={() => setOpen(false)} className="btn-dark">
                  Browse the shop
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                  {lines.map((l) => {
                    const p = byId(l.productId);
                    if (!p) return null;
                    return (
                      <li key={l.key} className="flex gap-4 py-5">
                        <Link to={`/product/${p.id}`} onClick={() => setOpen(false)} className="relative size-24 shrink-0 overflow-hidden">
                          <Photo id={p.images[0]} alt={p.name} w={240} className="h-full w-full" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <p className="font-medium leading-snug">{p.name}</p>
                            <button className="-mr-2 -mt-1 grid size-9 place-items-center text-muted hover:bg-ink/5 hover:text-danger" onClick={() => remove(l.key)} aria-label={`Remove ${p.name}`}>
                              <Trash size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-muted">
                            {l.color} · Size {l.size}
                          </p>
                          {l.gift && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink">
                              <Gift size={14} /> Gift wrapped for {l.gift.to || "recipient"}
                            </p>
                          )}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-line">
                              <button className="grid size-9 place-items-center hover:bg-ink/5" onClick={() => setQty(l.key, l.qty - 1)} aria-label="Decrease quantity">
                                <Minus size={14} />
                              </button>
                              <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
                                {l.qty}
                              </span>
                              <button className="grid size-9 place-items-center hover:bg-ink/5" onClick={() => setQty(l.key, l.qty + 1)} aria-label="Increase quantity">
                                <Plus size={14} />
                              </button>
                            </div>
                            <p className="font-semibold tabular-nums">{formatKES(lineTotal(l))}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-line bg-surface p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Subtotal</span>
                    <span className="text-xl font-semibold tabular-nums">{formatKES(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Delivery is calculated at checkout.</p>
                  <Link to="/checkout" onClick={() => setOpen(false)} className="btn-accent mt-4 w-full">
                    Checkout
                  </Link>
                  <button className="mt-2 w-full py-2 text-sm text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => setOpen(false)}>
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
