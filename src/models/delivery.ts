export type DeliveryMethod = "delivery" | "pickup";

/** A delivery zone from the API: its fee, ETA and the counties it covers. */
export interface DeliveryZoneInfo {
  id: string;
  label: string;
  fee: number;
  eta: string;
  /** Order value above which delivery is free, if the zone has one. */
  freeOver: number | null;
  counties: string[];
}

export type Zone = DeliveryZoneInfo;
