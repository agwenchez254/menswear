import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartState } from "@/models";
import { byId } from "@/data/products";
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
      // Drop saved lines whose product no longer exists in the catalogue, so the bag count matches what the bag can show.
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<CartState>;
        return { ...current, ...p, lines: (p.lines ?? []).filter((l) => byId(l.productId)) };
      },
    },
  ),
);
