export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderLine {
  key: string;
  name: string;
  colour: string;
  size: string;
  qty: number;
  lineTotal: number;
  /** Price of one pair, before any discount. Present on orders read back from the account. */
  unitPrice?: number;
  /** Recipient's name when the line is a gift ("" when none was given); undefined for non-gifts. */
  giftTo?: string;
}

/** VAT included in an order's total, fixed when the order was placed. Orders placed while VAT was off have none. */
export interface OrderVat {
  ratePercent: number;
  /** The VAT inside the total. */
  amount: number;
  /** The total without VAT. */
  net: number;
  seller: { businessName: string; kraPin: string; address: string };
}

/** An order as the backend recorded it. */
export interface Order {
  /** The order number, e.g. JB-000123. */
  id: string;
  /** ISO timestamp. */
  placedAt: string;
  lines: OrderLine[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  /** Human-readable delivery summary, e.g. "Delivery to Nairobi". */
  method: string;
  /** mpesa, airtel, card or cod. */
  paymentMethod: string;
  /** Human-readable payment method label. */
  payment: string;
  paymentStatus: PaymentStatus;
  name: string;
  /** The account's phone, normalised to +254 format. */
  phone: string;
  /** The number the payment prompt went to (mobile money), which can differ from the account's phone. */
  payerPhone: string | null;
  /** Who receives the order, when given at checkout. */
  contactName: string | null;
  contactPhone: string | null;
  address: string;
  eta: string;
  /** Null or missing when the order carries no VAT. */
  vat?: OrderVat | null;
}

/** One row of the account's order list. */
export interface OrderSummary {
  number: string;
  /** pending, paid, packed, shipped, delivered, cancelled or refunded. */
  status: string;
  paymentStatus: PaymentStatus;
  /** Human-readable delivery summary. */
  method: string;
  /** Human-readable payment method label. */
  payment: string;
  total: number;
  lineCount: number;
  /** ISO timestamp. */
  placedAt: string;
}

/** One of the signed-in customer's orders, with everything the order page and the receipt show. */
export interface MyOrder extends Order {
  status: string;
  email: string;
  delivery: number;
  /** Customer-visible steps, oldest first. */
  timeline: { type: string; at: string }[];
}
