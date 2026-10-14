import type { CartLine, DeliveryMethod, Zone } from "@/models";
import { byId } from "@/data/products";
import { FREE_NAIROBI_DELIVERY_OVER, GIFT_FEE, PROMO } from "@/config/commerce";

/** Price of one unit of a cart line, including the gift-wrap fee when the line is a gift. */
export const unitPrice = (line: CartLine): number => (byId(line.productId)?.price ?? 0) + (line.gift ? GIFT_FEE : 0);

export const lineTotal = (line: CartLine): number => unitPrice(line) * line.qty;

export const cartSubtotal = (lines: CartLine[]): number => lines.reduce((sum, l) => sum + lineTotal(l), 0);

export const cartCount = (lines: CartLine[]): number => lines.reduce((sum, l) => sum + l.qty, 0);

/** Delivery fee for a method and destination zone. Pickup is free; an unknown zone has no fee yet. */
export const deliveryFee = (method: DeliveryMethod, zone: Zone | undefined, subtotal: number): number => {
  if (method === "pickup" || !zone) return 0;
  if (zone.id === "nairobi" && subtotal >= FREE_NAIROBI_DELIVERY_OVER) return 0;
  return zone.fee;
};

export const promoDiscount = (subtotal: number, applied: boolean): number =>
  applied ? Math.round((subtotal * PROMO.percent) / 100) : 0;

export const orderTotal = (subtotal: number, discount: number, delivery: number): number => subtotal - discount + delivery;

/** Pay-on-delivery is limited to Nairobi delivery and studio pickup. */
export const isCodAllowed = (method: DeliveryMethod, zone: Zone | undefined): boolean =>
  method === "pickup" || zone?.id === "nairobi";
