import type { Order } from "./order";

export interface GiftInfo {
  wrap: string;
  ribbon: string;
  message: string;
  from: string;
  to: string;
}

/** What the bag shows for a line, captured when the item is added. */
export interface ProductSnapshot {
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

export interface CartLine {
  /** Stable identity: product + size + colour + gift message. */
  key: string;
  productId: string;
  size: string;
  color: string;
  qty: number;
  snapshot: ProductSnapshot;
  gift?: GiftInfo;
}

/** What callers pass to `add`. The key is derived and quantity defaults to 1. */
export type NewCartLine = Omit<CartLine, "key" | "qty"> & { qty?: number };

export interface CartState {
  lines: CartLine[];
  /** Whether the bag drawer is open. */
  open: boolean;
  lastOrder: Order | null;
  add: (line: NewCartLine) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  setLastOrder: (order: Order) => void;
}
