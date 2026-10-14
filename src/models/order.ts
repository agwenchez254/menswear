import type { CartLine } from "./cart";
import type { DeliveryMethod } from "./delivery";

export interface Order {
  id: string;
  /** ISO timestamp. */
  placedAt: string;
  lines: CartLine[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  /** Human-readable delivery summary, e.g. "Delivery to Kilimani, Nairobi". */
  method: string;
  /** Human-readable payment method label. */
  payment: string;
  name: string;
  /** Normalised to +254 format when valid. */
  phone: string;
  address: string;
  eta: string;
}

/** Everything needed to turn a checkout into an order record. */
export interface OrderDraft {
  lines: CartLine[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  /** Town or estate. */
  area: string;
  county: string;
  street: string;
  paymentLabel: string;
  name: string;
  phone: string;
  /** Delivery estimate for the destination zone, when known. */
  zoneEta?: string;
}
