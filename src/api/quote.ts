import { useEffect, useMemo, useState } from "react";
import type { CartLine, DeliveryMethod } from "@/models";
import { useAppDispatch } from "@/store/hooks";
import { variantIdFor } from "@/lib/variant";
import { baseApi } from "./baseApi";
import { catalogueApi } from "./catalogue";

export interface QuoteLine {
  variantId: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineSubtotal: number;
  discount: number;
  lineTotal: number;
  available: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  method: DeliveryMethod;
  /** Delivery was asked for but no county was given, so the fee is not in the total yet. */
  deliveryPending: boolean;
  codAllowed: boolean;
  giftFee: number;
  /** The VAT inside the total, or null while VAT is off. */
  vat?: { ratePercent: number; amount: number } | null;
  delivery: { zone: string; eta: string; etaDays: number } | null;
  applied: { name: string; code: string | null; amount: number; freeDelivery: boolean }[];
  /** Present when a code was sent. */
  promo: { code: string; valid: boolean; reason?: string } | null;
  warnings: { variantId: string; type: string; message: string; available: number }[];
}

export interface QuoteRequest {
  lines: { variantId: string; qty: number; gift?: CartLine["gift"] }[];
  method: DeliveryMethod;
  county?: string;
  promoCode?: string;
  phone?: string;
}

export const quoteApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** The authoritative price of a bag: promotions, delivery, gift wrap and stock are all worked out by the server. */
    getQuote: b.query<Quote, QuoteRequest>({
      query: (body) => ({ url: "/cart/quote", method: "POST", body }),
    }),
  }),
});

export const { useGetQuoteQuery } = quoteApi;

/** Turns bag lines into the variant ids the API prices. `null` = that product or size no longer exists. */
export function useVariantIds(lines: CartLine[]): { ids: Record<string, string | null>; ready: boolean } {
  const dispatch = useAppDispatch();
  const [ids, setIds] = useState<Record<string, string | null>>({});
  const wanted = useMemo(() => lines.map((l) => `${l.key}\u0000${l.snapshot.slug}\u0000${l.color}\u0000${l.size}`).join("\u0001"), [lines]);

  useEffect(() => {
    let live = true;
    const rows = wanted ? wanted.split("\u0001").map((r) => r.split("\u0000")) : [];
    const slugs = [...new Set(rows.map((r) => r[1]))];
    void Promise.all(
      slugs.map((slug) =>
        dispatch(catalogueApi.endpoints.getProduct.initiate(slug))
          .unwrap()
          .then((p) => [slug, p] as const)
          .catch(() => [slug, null] as const),
      ),
    ).then((found) => {
      if (!live) return;
      const bySlug = new Map(found);
      setIds(Object.fromEntries(rows.map(([key, slug, color, size]) => [key, variantIdFor(bySlug.get(slug)?.variants ?? [], color, size)])));
    });
    return () => {
      live = false;
    };
  }, [wanted, dispatch]);

  return { ids, ready: lines.every((l) => l.key in ids) };
}

interface QuoteInput {
  lines: CartLine[];
  method: DeliveryMethod;
  county?: string;
  promoCode?: string;
  phone?: string;
}

/** The server's price for the bag, plus the bag lines it could not price. */
export function useCartQuote({ lines, method, county, promoCode, phone }: QuoteInput) {
  const { ids, ready } = useVariantIds(lines);
  const priced = lines.filter((l) => ids[l.key]);
  const body: QuoteRequest = {
    lines: priced.map((l) => ({ variantId: ids[l.key] as string, qty: l.qty, ...(l.gift && { gift: l.gift }) })),
    method,
    ...(method === "delivery" && county ? { county } : {}),
    ...(promoCode ? { promoCode } : {}),
    ...(phone ? { phone } : {}),
  };
  const q = useGetQuoteQuery(body, { skip: !ready || body.lines.length === 0 });
  return {
    quote: q.data,
    request: body,
    /** True until the first price arrives. */
    loading: !ready || (body.lines.length > 0 && q.isLoading),
    /** True while a changed bag is being re-priced. */
    updating: q.isFetching,
    error: q.error,
    /** Lines whose product or size is gone. */
    unavailable: ready ? lines.filter((l) => !ids[l.key]) : [],
    refetch: q.refetch,
  };
}
