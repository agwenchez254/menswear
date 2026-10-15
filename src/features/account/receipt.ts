import type { MyOrder, OrderVat } from "../../models/order.ts";

export const ETIMS_NOTICE = "This is a receipt for your order. It is not a KRA eTIMS tax invoice.";

export type AccountTab = "profile" | "orders";

/** The tab named in the query string (`?tab=orders`). Anything else is the profile. */
export function parseTab(search: string): AccountTab {
  return new URLSearchParams(search).get("tab") === "orders" ? "orders" : "profile";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function statusLabel(status: string): string {
  const known = STATUS_LABELS[status];
  if (known) return known;
  const words = status.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface ReceiptModel {
  /** "Receipt" once paid, otherwise an order summary that says it is unpaid. */
  heading: string;
  /** Shown prominently for orders that were cancelled or refunded. */
  banner: "Cancelled" | "Refunded" | null;
  /** Seller details, only on orders that were placed with VAT on. */
  seller: OrderVat["seller"] | null;
  /** The VAT inside the total and the total without it, or null when the order carries no VAT. */
  vat: { label: string; amount: number; net: number } | null;
  notice: string;
}

/** What the receipt shows, decided from the order alone so the page and the print layout cannot disagree. */
export function receiptModel(order: MyOrder): ReceiptModel {
  const banner = order.status === "refunded" ? "Refunded" : order.status === "cancelled" ? "Cancelled" : null;
  const paid = order.paymentStatus === "paid" && banner === null;
  const v = order.vat ?? null;
  return {
    heading: paid ? "Receipt" : banner ? `Order summary (${banner.toLowerCase()})` : "Order summary (unpaid)",
    banner,
    seller: v ? v.seller : null,
    vat: v ? { label: `VAT (${Number(v.ratePercent)}%) included`, amount: v.amount, net: v.net } : null,
    notice: ETIMS_NOTICE,
  };
}
