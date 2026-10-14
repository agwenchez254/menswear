import type { DeliveryZoneInfo } from "@/models";
import { baseApi } from "./baseApi";
import { toZoneInfo } from "./adapters";
import type { ApiZone } from "./types";

export const deliveryApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getZones: b.query<DeliveryZoneInfo[], void>({
      query: () => "/delivery/zones",
      transformResponse: (r: ApiZone[]) => r.map(toZoneInfo),
      providesTags: ["Delivery"],
    }),
  }),
});

export const { useGetZonesQuery } = deliveryApi;
