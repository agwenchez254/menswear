import { baseApi } from "./baseApi";
import { toMyOrder, toOrder, toOrderSummary, toPaymentStatus, type ApiMyOrder, type ApiOrder, type ApiOrderSummary, type ApiTrack } from "./orderAdapter";
import type { MyOrder, Order, OrderSummary, PaymentStatus } from "@/models";
import type { QuoteRequest } from "./quote";
import type { PaymentMethod } from "@/features/checkout/models";

export interface PlaceOrderInput {
  /** Reusing the key on a retry returns the order already placed instead of a second one. */
  idempotencyKey: string;
  lines: QuoteRequest["lines"];
  method: QuoteRequest["method"];
  county?: string;
  address?: string;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  notes?: string;
  /** Mobile-money number to prompt (M-Pesa, Airtel). */
  payerPhone?: string;
  /** Who receives the order. The account's own name and phone are kept separately. */
  contactName?: string;
  contactPhone?: string;
}

export interface PlacedOrder {
  order: Order;
  /** What the payment provider said when the prompt was sent; null on a replay or if it failed to start. */
  payment: { status: string; message: string } | null;
  replay: boolean;
}

export interface OrderStatus {
  status: string;
  paymentStatus: PaymentStatus;
}

export interface TrackedOrder {
  number: string;
  status: string;
  method: "delivery" | "pickup";
  eta: string | null;
  county: string | null;
  createdAt: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  lines: { name: string; colour: string; size: string; qty: number; unitPrice: number }[];
  /** Customer-visible steps, oldest first. */
  timeline: { type: string; at: string }[];
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    placeOrder: b.mutation<PlacedOrder, PlaceOrderInput>({
      query: ({ idempotencyKey, ...body }) => ({ url: "/orders", method: "POST", body, headers: { "Idempotency-Key": idempotencyKey } }),
      invalidatesTags: ["Orders"],
      transformResponse: (r: { order: ApiOrder; payment: { status: string; message: string } | null; idempotentReplay: boolean }) => ({
        order: toOrder(r.order),
        payment: r.payment,
        replay: r.idempotentReplay,
      }),
    }),
    /** Payment progress of an order. Needs the phone on the order, so it works for the signed-in customer's own orders. */
    getOrderStatus: b.query<OrderStatus, { number: string; phone: string }>({
      query: ({ number, phone }) => ({ url: `/orders/${encodeURIComponent(number)}`, params: { phone } }),
      transformResponse: (r: ApiTrack): OrderStatus => ({ status: r.status, paymentStatus: toPaymentStatus(r.paymentStatus) }),
      providesTags: ["OrderStatus"],
    }),
    /** Full tracking view for the "Track an order" page: order number plus the phone on the order. */
    trackOrder: b.query<TrackedOrder, { number: string; phone: string }>({
      query: ({ number, phone }) => ({ url: `/orders/${encodeURIComponent(number.trim())}`, params: { phone } }),
      transformResponse: (r: TrackedOrder & { paymentStatus: string }): TrackedOrder => ({ ...r, paymentStatus: toPaymentStatus(r.paymentStatus) }),
      providesTags: ["OrderStatus"],
    }),
    /** The signed-in customer's own orders, newest first. */
    getMyOrders: b.query<{ items: OrderSummary[]; total: number; page: number; limit: number }, { page: number; limit?: number }>({
      query: ({ page, limit = 10 }) => ({ url: "/me/orders", params: { page, limit } }),
      transformResponse: (r: { items: ApiOrderSummary[]; total: number; page: number; limit: number }) => ({ ...r, items: r.items.map(toOrderSummary) }),
      providesTags: ["Orders"],
    }),
    /** One of the signed-in customer's own orders, for the order page and the receipt. */
    getMyOrder: b.query<MyOrder, string>({
      query: (number) => `/me/orders/${encodeURIComponent(number)}`,
      transformResponse: (r: ApiMyOrder) => toMyOrder(r),
      providesTags: ["Orders"],
    }),
    /** Sends the payment prompt again for the signed-in customer's own pending order, to the number they choose. */
    resendPrompt: b.mutation<{ status: string; message: string; payerPhone: string }, { number: string; payerPhone?: string }>({
      query: ({ number, payerPhone }) => ({ url: `/orders/${encodeURIComponent(number)}/pay`, method: "POST", body: payerPhone ? { payerPhone } : {} }),
    }),
  }),
});

export const { usePlaceOrderMutation, useGetMyOrdersQuery, useGetMyOrderQuery, useLazyGetOrderStatusQuery, useGetOrderStatusQuery, useTrackOrderQuery, useResendPromptMutation } = ordersApi;
