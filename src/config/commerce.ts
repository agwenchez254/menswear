/** Business rules in one place so pricing, UI copy and tests agree. */

/** Nairobi orders at or above this subtotal ship free. */
export const FREE_NAIROBI_DELIVERY_OVER = 10_000;

/** Extra charge per gift-wrapped unit. */
export const GIFT_FEE = 350;

/** Highest quantity of one line a shopper can add. */
export const MAX_LINE_QTY = 10;

export const PROMO = { code: "JABALI10", percent: 10 } as const;

export const PICKUP_ADDRESS = "Jabali Studio, 2nd Floor, Kimathi House, Kimathi Street, Nairobi CBD";
