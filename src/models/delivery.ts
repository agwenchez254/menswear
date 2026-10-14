export type ZoneId = "nairobi" | "metro" | "regional" | "far";

export interface Zone {
  id: ZoneId;
  label: string;
  /** Delivery fee in Kenya Shillings. */
  fee: number;
  eta: string;
  counties: string[];
}

export type DeliveryMethod = "delivery" | "pickup";

/** A delivery zone as shown on the home page (from the API). Checkout still uses `Zone`. */
export interface DeliveryZoneInfo {
  id: string;
  label: string;
  fee: number;
  eta: string;
  /** Order value above which delivery is free, if the zone has one. */
  freeOver: number | null;
}
