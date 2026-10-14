import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartState } from "@/models";
import { MAX_LINE_QTY } from "@/config/commerce";

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      lastOrder: null,
      add: (line) =>
        set((s) => {
          const key = `${line.productId}|${line.size}|${line.color}|${line.gift ? "gift:" + line.gift.message : ""}`;
          const existing = s.lines.find((l) => l.key === key);
          const qty = line.qty ?? 1;
          if (existing) {
            return { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, MAX_LINE_QTY) } : l)), open: true };
          }
          return { lines: [...s.lines, { ...line, key, qty }], open: true };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, MAX_LINE_QTY) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
      setLastOrder: (o) => set({ lastOrder: o }),
    }),
    {
      name: "jabali-cart",
      partialize: (s) => ({ lines: s.lines, lastOrder: s.lastOrder }),
      // Bags saved before products came from the API have no snapshot and cannot be shown: drop them.
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<CartState>;
        const lastOrder = p.lastOrder?.lines.every((l) => l.snapshot) ? p.lastOrder : null;
        return { ...current, ...p, lastOrder, lines: (p.lines ?? []).filter((l) => l.snapshot?.slug) };
      },
    },
  ),
);
