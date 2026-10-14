import { create } from "zustand";
import { persist } from "zustand/middleware";
import { byId } from "../data/products";

export interface GiftInfo {
  wrap: string;
  ribbon: string;
  message: string;
  from: string;
  to: string;
}

export interface CartLine {
  key: string;
  productId: string;
  size: string;
  color: string;
  qty: number;
  gift?: GiftInfo;
}

export interface Order {
  id: string;
  placedAt: string;
  lines: CartLine[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  method: string;
  payment: string;
  name: string;
  phone: string;
  address: string;
  eta: string;
}

interface CartState {
  lines: CartLine[];
  open: boolean;
  lastOrder: Order | null;
  add: (line: Omit<CartLine, "key" | "qty"> & { qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  setLastOrder: (o: Order) => void;
}

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
            return { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 10) } : l)), open: true };
          }
          return { lines: [...s.lines, { ...line, key, qty }], open: true };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 10) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
      setLastOrder: (o) => set({ lastOrder: o }),
    }),
    { name: "jabali-cart", partialize: (s) => ({ lines: s.lines, lastOrder: s.lastOrder }) },
  ),
);

export const GIFT_FEE = 350;
export const unitPrice = (l: CartLine) => (byId(l.productId)?.price ?? 0) + (l.gift ? GIFT_FEE : 0);
export const lineTotal = (l: CartLine) => unitPrice(l) * l.qty;
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + lineTotal(l), 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.qty, 0);
