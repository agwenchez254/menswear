import type { Order, OrderDraft } from "@/models";
import { PICKUP_ADDRESS } from "@/config/commerce";
import { normalizePhone } from "@/lib/phone";

/** Build the order record shown on the confirmation page. */
export const createOrder = (d: OrderDraft): Order => {
  const pickup = d.deliveryMethod === "pickup";
  return {
    id: `JB-${Math.floor(100000 + Math.random() * 899999)}`,
    placedAt: new Date().toISOString(),
    lines: d.lines,
    subtotal: d.subtotal,
    delivery: d.delivery,
    discount: d.discount,
    total: d.total,
    method: pickup ? "Studio pickup" : `Delivery to ${d.area}, ${d.county}`,
    payment: d.paymentLabel,
    name: d.name,
    phone: normalizePhone(d.phone) ?? d.phone,
    address: pickup ? PICKUP_ADDRESS : `${d.street}, ${d.area}, ${d.county}`,
    eta: pickup ? "Ready for pickup in 2 hours" : (d.zoneEta ?? "2 to 5 working days"),
  };
};
