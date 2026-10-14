import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TAGS } from "./tags";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api/v1";

/** Public storefront API (no auth). Content endpoints are injected per domain, like the dashboard. */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/store` }),
  tagTypes: TAGS,
  endpoints: () => ({}),
});

/** Human-readable message from the backend's problem+json errors. */
export function errorMessage(err: unknown): string {
  const e = err as { data?: { detail?: string; title?: string }; error?: string };
  return e?.data?.detail ?? e?.data?.title ?? e?.error ?? "Something went wrong";
}

export const isNotFound = (err: unknown): boolean => (err as { status?: unknown } | undefined)?.status === 404;
