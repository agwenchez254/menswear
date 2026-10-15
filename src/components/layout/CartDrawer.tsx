import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, X } from "@phosphor-icons/react";
import { useCart } from "@/store/cart";
import { CartLineItem } from "@/components/layout/CartLineItem";
import { useCartQuote } from "@/api/quote";
import { useSiteSettings } from "@/api/settings";
import { cartSubtotal } from "@/services/pricing";
import { formatKES } from "@/lib/format";
import { ROUTES } from "@/config/routes";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove } = useCart();
  const { giftFee } = useSiteSettings();
  // Priced by the server when it answers; the estimate covers the moment before that.
  const { quote } = useCartQuote({ lines: open ? lines : [], method: "pickup" });
  const subtotal = quote?.subtotal ?? cartSubtotal(lines, giftFee);

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
                <Link to={ROUTES.shop} onClick={() => setOpen(false)} className="btn-dark">
                  Browse the shop
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                  {lines.map((l) => (
                    <CartLineItem key={l.key} line={l} onQty={(qty) => setQty(l.key, qty)} onRemove={() => remove(l.key)} onNavigate={() => setOpen(false)} />
                  ))}
                </ul>
                <div className="border-t border-line bg-surface p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Subtotal</span>
                    <span className="text-xl font-semibold tabular-nums">{formatKES(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Delivery is calculated at checkout.</p>
                  <Link to={ROUTES.checkout} onClick={() => setOpen(false)} className="btn-accent mt-4 w-full">
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
