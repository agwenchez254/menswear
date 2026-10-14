import type { CategoryDef, Gender, Product, ProductDetail } from "@/models";
import { baseApi } from "./baseApi";
import { toCategory, toProduct, toProductDetail } from "./adapters";
import type { ApiCategory, ApiProductCard, ApiProductDetail, CursorPage } from "./types";

/** The API caps a page at 60 products. */
const PAGE = 60;

export const catalogueApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Every active product for one side of the store, following the cursor to the end. */
    getProducts: b.query<Product[], Gender>({
      async queryFn(gender, _api, _extra, baseQuery) {
        const items: ApiProductCard[] = [];
        let cursor: string | null = null;
        do {
          const res = await baseQuery({ url: "/products", params: { gender, limit: PAGE, ...(cursor ? { cursor } : {}) } });
          if (res.error) return { error: res.error };
          const page = res.data as CursorPage<ApiProductCard>;
          items.push(...page.items);
          cursor = page.nextCursor;
        } while (cursor);
        return { data: items.map(toProduct) };
      },
      providesTags: ["Product"],
    }),
    getProduct: b.query<ProductDetail, string>({
      query: (slug) => `/products/${encodeURIComponent(slug)}`,
      transformResponse: (r: ApiProductDetail) => toProductDetail(r),
      providesTags: ["Product"],
    }),
    getCategories: b.query<CategoryDef[], Gender>({
      query: (gender) => ({ url: "/categories", params: { gender } }),
      transformResponse: (r: ApiCategory[]) => r.map(toCategory),
      providesTags: ["Category"],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductQuery, useGetCategoriesQuery } = catalogueApi;
