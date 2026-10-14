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
