import { baseApi } from "./baseApi";

/** A saved delivery place. The customer keeps several and picks one per order. */
export interface SavedAddress {
  id: string;
  label: string;
  county: string;
  area: string;
  street: string;
  recipient: string | null;
  phone: string | null;
  isDefault: boolean;
}

export type NewAddress = Pick<SavedAddress, "label" | "county" | "area" | "street"> & { recipient?: string; phone?: string; isDefault?: boolean };

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAddresses: b.query<SavedAddress[], void>({
      query: () => "/me/addresses",
      providesTags: ["Addresses"],
    }),
    createAddress: b.mutation<SavedAddress, NewAddress>({
      query: (body) => ({ url: "/me/addresses", method: "POST", body }),
      invalidatesTags: ["Addresses"],
    }),
    updateAddress: b.mutation<SavedAddress, { id: string } & Partial<NewAddress>>({
      query: ({ id, ...body }) => ({ url: `/me/addresses/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Addresses"],
    }),
    deleteAddress: b.mutation<void, string>({
      query: (id) => ({ url: `/me/addresses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Addresses"],
    }),
  }),
});

export const { useGetAddressesQuery, useCreateAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } = addressesApi;
