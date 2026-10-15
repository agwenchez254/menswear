import type { CartLine } from "@/models";

/**
 * Estimates for showing the bag before the server has priced it. The checkout total, delivery fee, discounts and
 * stock always come from the API (`useCartQuote`); these never decide what a customer pays.
 */

/** Price of one unit of a bag line, including the gift-wrap fee for gifts. */
export const unitPrice = (line: CartLine, giftFee: number): number => line.snapshot.price + (line.gift ? giftFee : 0);

export const lineTotal = (line: CartLine, giftFee: number): number => unitPrice(line, giftFee) * line.qty;

export const cartSubtotal = (lines: CartLine[], giftFee: number): number => lines.reduce((sum, l) => sum + lineTotal(l, giftFee), 0);

export const cartCount = (lines: CartLine[]): number => lines.reduce((sum, l) => sum + l.qty, 0);
