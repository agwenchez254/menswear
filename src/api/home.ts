import type { Gender, HomeData } from "@/models";
import { baseApi } from "./baseApi";
import { toHome } from "./adapters";
import type { ApiHome } from "./types";

export const homeApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Hero, trust strip, titles, gift teaser, testimonials, categories and top sellers in one call. */
    getHome: b.query<HomeData, Gender>({
      query: (gender) => ({ url: "/home", params: { gender } }),
      transformResponse: (r: ApiHome, _meta, gender) => toHome(r, gender),
      providesTags: ["Home"],
    }),
  }),
});

export const { useGetHomeQuery } = homeApi;
