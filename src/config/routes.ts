/** Route patterns in one place. Use the helpers below to build concrete links. */
export const ROUTES = {
  home: "/",
  shop: "/shop",
  category: "/category/:slug",
  product: "/product/:slug",
  gift: "/gift",
  checkout: "/checkout",
  order: "/order/:id",
  account: "/account",
  notFound: "*",
} as const;

export const productPath = (slug: string): string => `/product/${slug}`;
export const orderPath = (id: string): string => `/order/${id}`;
export const shopPath = (params?: { cat?: string; sort?: string; q?: string }): string => {
  const search = new URLSearchParams();
  if (params?.cat) search.set("cat", params.cat);
  if (params?.sort) search.set("sort", params.sort);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return qs ? `${ROUTES.shop}?${qs}` : ROUTES.shop;
};
