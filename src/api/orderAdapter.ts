import type { MyOrder, Order, OrderLine, OrderSummary, OrderVat, PaymentStatus } from "../models/order.ts";

/** Wire shapes of `POST /store/orders` and `GET /store/orders/:number`. */
export interface ApiOrder {
  number: string | null;
  id: string;
  status: string;
  method: "delivery" | "pickup";
  paymentMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  county: string | null;
  address: string | null;
  eta: string | null;
  createdAt: string;
  contactName?: string | null;
  contactPhone?: string | null;
  customer: { name: string; phone: string };
  lines: { id: string; name: string; colour: string; size: string; qty: number; lineTotal: number; gift: Record<string, unknown> | null }[];
  payments: { status: string; payerPhone?: string | null }[];
  vat?: OrderVat | null;
}

/** Wire shape of `GET /store/me/orders`. */
export interface ApiOrderSummary {
  number: string;
  status: string;
  paymentStatus: string;
  method: "delivery" | "pickup";
  paymentMethod: string;
  total: number;
  lineCount: number;
  createdAt: string;
}

/** Wire shape of `GET /store/me/orders/:number`. */
export interface ApiMyOrder {
  number: string;
  status: string;
  method: "delivery" | "pickup";
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  eta: string | null;
  county: string | null;
  address: string | null;
  notes: string | null;
  contactName: string | null;
  contactPhone: string | null;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  vat: OrderVat | null;
  customer: { name: string; email: string; phone: string };
  lines: { id: string; name: string; colour: string; size: string; qty: number; unitPrice: number; discount: number; lineTotal: number; giftTo?: string }[];
  payments: { provider: string; status: string; amount: number; payerPhone?: string | null; createdAt: string }[];
  timeline: { type: string; at: string }[];
}

export interface ApiTrack {
  number: string;
  status: string;
  paymentStatus: string;
}

const LABELS: Record<string, string> = { mpesa: "M-Pesa", airtel: "Airtel Money", card: "Card", cod: "Pay on delivery" };
const STATUSES: readonly PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export const paymentLabel = (method: string): string => LABELS[method] ?? method;

export const toPaymentStatus = (s: string | undefined): PaymentStatus => (STATUSES.includes(s as PaymentStatus) ? (s as PaymentStatus) : "pending");

export function toOrder(o: ApiOrder): Order {
  const lines: OrderLine[] = o.lines.map((l) => ({
    key: l.id,
    name: l.name,
    colour: l.colour,
    size: l.size,
    qty: l.qty,
    lineTotal: l.lineTotal,
    giftTo: typeof l.gift?.to === "string" ? l.gift.to : l.gift ? "" : undefined,
  }));
  const pickup = o.method === "pickup";
  return {
    id: o.number ?? o.id,
    placedAt: o.createdAt,
    lines,
    subtotal: o.subtotal,
    delivery: o.deliveryFee,
    discount: o.discount,
    total: o.total,
    method: pickup ? "Studio pickup" : `Delivery to ${o.county ?? "your address"}`,
    paymentMethod: o.paymentMethod,
    payment: paymentLabel(o.paymentMethod),
    paymentStatus: toPaymentStatus(o.payments[o.payments.length - 1]?.status),
    name: o.customer.name,
    phone: o.customer.phone,
    payerPhone: o.payments[o.payments.length - 1]?.payerPhone ?? null,
    contactName: o.contactName ?? null,
    contactPhone: o.contactPhone ?? null,
    address: o.address ?? "",
    eta: o.eta ?? (pickup ? "Ready for pickup in 2 hours" : "2 to 5 working days"),
    vat: o.vat ?? null,
  };
}

const methodLabel = (method: "delivery" | "pickup", county: string | null): string => (method === "pickup" ? "Studio pickup" : `Delivery to ${county ?? "your address"}`);

export function toOrderSummary(o: ApiOrderSummary): OrderSummary {
  return {
    number: o.number,
    status: o.status,
    paymentStatus: toPaymentStatus(o.paymentStatus),
    method: methodLabel(o.method, null),
    payment: paymentLabel(o.paymentMethod),
    total: o.total,
    lineCount: o.lineCount,
    placedAt: o.createdAt,
  };
}

export function toMyOrder(o: ApiMyOrder): MyOrder {
  const pickup = o.method === "pickup";
  const last = o.payments[o.payments.length - 1];
  return {
    id: o.number,
    status: o.status,
    placedAt: o.createdAt,
    lines: o.lines.map((l) => ({ key: l.id, name: l.name, colour: l.colour, size: l.size, qty: l.qty, lineTotal: l.lineTotal, unitPrice: l.unitPrice, giftTo: l.giftTo })),
    subtotal: o.subtotal,
    delivery: o.deliveryFee,
    discount: o.discount,
    total: o.total,
    method: methodLabel(o.method, o.county),
    paymentMethod: o.paymentMethod,
    payment: paymentLabel(o.paymentMethod),
    paymentStatus: toPaymentStatus(o.paymentStatus),
    name: o.customer.name,
    email: o.customer.email,
    phone: o.customer.phone,
    payerPhone: last?.payerPhone ?? null,
    contactName: o.contactName,
    contactPhone: o.contactPhone,
    address: o.address ?? "",
    eta: o.eta ?? (pickup ? "Ready for pickup in 2 hours" : "2 to 5 working days"),
    vat: o.vat,
    timeline: o.timeline,
  };
}
