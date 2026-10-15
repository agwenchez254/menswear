export type Tone = "success" | "info" | "alert";

/** What the server pushes to a customer about one of their own orders. */
export interface OrderEvent {
  id: string;
  kind: "order.created" | "order.status";
  number: string;
  status: string;
  previousStatus?: string;
  total: number;
  method: "delivery" | "pickup";
  paymentMethod: string;
  at: number;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  tone: Tone;
  number: string;
  at: number;
  read: boolean;
}

const kes = (n: number): string => `KES ${n.toLocaleString("en-KE")}`;

const STATUS: Record<string, { title: string; body: (e: OrderEvent) => string; tone: Tone }> = {
  paid: { title: "Payment received", body: (e) => `Thank you. Order ${e.number} is paid and being prepared.`, tone: "success" },
  packed: { title: "Order packed", body: (e) => `Order ${e.number} is packed and ready to go.`, tone: "info" },
  shipped: { title: "On its way", body: (e) => `Order ${e.number} has left us${e.method === "delivery" ? " and is heading to you" : ""}.`, tone: "info" },
  delivered: { title: "Delivered", body: (e) => `Order ${e.number} has been delivered. Enjoy!`, tone: "success" },
  cancelled: { title: "Order cancelled", body: (e) => `Order ${e.number} was cancelled.`, tone: "alert" },
  refunded: { title: "Refund issued", body: (e) => `Order ${e.number} was refunded.`, tone: "info" },
};

/** Turns a pushed order event into the text shown in the bell and the pop-up. Returns null for events with nothing to say. */
export function noticeFor(e: OrderEvent): Notice | null {
  if (e.kind === "order.created") {
    const pay = e.paymentMethod === "cod" ? "You will pay on delivery." : "We are waiting for your payment.";
    return { id: e.id, title: "Order placed", body: `Order ${e.number} for ${kes(e.total)} is confirmed. ${pay}`, tone: "success", number: e.number, at: e.at, read: false };
  }
  const s = STATUS[e.status];
  return s ? { id: e.id, title: s.title, body: s.body(e), tone: s.tone, number: e.number, at: e.at, read: false } : null;
}

/** Validates the JSON of an `order` event. */
export function parseOrderEvent(raw: string): OrderEvent | null {
  try {
    const v = JSON.parse(raw) as Partial<OrderEvent> | null;
    if (!v || typeof v !== "object") return null;
    if (typeof v.id !== "string" || typeof v.number !== "string" || typeof v.status !== "string" || typeof v.total !== "number" || typeof v.at !== "number") return null;
    if (v.kind !== "order.created" && v.kind !== "order.status") return null;
    return { id: v.id, kind: v.kind, number: v.number, status: v.status, previousStatus: v.previousStatus, total: v.total, method: v.method === "pickup" ? "pickup" : "delivery", paymentMethod: String(v.paymentMethod ?? ""), at: v.at };
  } catch {
    return null;
  }
}
