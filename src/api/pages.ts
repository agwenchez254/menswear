import { baseApi } from "./baseApi";
import { toPage, type CmsPage } from "./pageAdapter";

export interface ContentBlock {
  key: string;
  kind: string;
  data: unknown;
}

export const pagesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** A published help or info page, e.g. "delivery-and-returns". 404 when it does not exist or is a draft. */
    getPage: b.query<CmsPage, string>({
      query: (slug) => `/pages/${encodeURIComponent(slug)}`,
      transformResponse: (r: { slug: string; title: string; blocks: unknown }) => toPage(r),
      providesTags: ["Content"],
    }),
    /** One live content block by key (the home page already receives its blocks with `/home`). */
    getContentBlock: b.query<ContentBlock, string>({
      query: (key) => `/content/${encodeURIComponent(key)}`,
      providesTags: ["Content"],
    }),
  }),
});

export const { useGetPageQuery, useGetContentBlockQuery } = pagesApi;
