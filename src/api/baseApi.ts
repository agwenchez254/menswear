import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { needsAuthHeader, shouldRefresh } from "./authFlow";
import { TAGS } from "./tags";
import { signedOut, tokensRotated, userUpdated } from "@/store/authSlice";
import type { AuthState, AuthUser } from "@/store/authPersist";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api/v1";

const authOf = (api: { getState: () => unknown }): AuthState => (api.getState() as { auth: AuthState }).auth;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/store`,
  // The Authorization header goes only to authenticated endpoints, so public GETs stay simple cross-origin requests.
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = (getState() as { auth: AuthState }).auth.accessToken;
    if (token && needsAuthHeader(endpoint)) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

let refreshing: Promise<boolean> | null = null;

/** On a 401 from an authenticated call, rotate the refresh token once and retry; a failed refresh signs the customer out. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  const refreshToken = authOf(api).refreshToken;
  if (result.error && shouldRefresh(result.error.status, api.endpoint, !!refreshToken)) {
    refreshing ??= (async () => {
      const r = await rawBaseQuery({ url: "/auth/refresh", method: "POST", body: { refreshToken } }, api, extra);
      if (r.data) {
        const d = r.data as { accessToken: string; refreshToken: string; customer: AuthUser };
        api.dispatch(tokensRotated({ accessToken: d.accessToken, refreshToken: d.refreshToken }));
        api.dispatch(userUpdated(d.customer));
        return true;
      }
      api.dispatch(signedOut());
      return false;
    })().finally(() => {
      refreshing = null;
    });
    if (await refreshing) result = await rawBaseQuery(args, api, extra);
  }
  return result;
};

/** Public storefront API. Content endpoints are injected per domain, like the dashboard. */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: TAGS,
  endpoints: () => ({}),
});

/** Human-readable message from the backend's problem+json errors. */
export function errorMessage(err: unknown): string {
  const e = err as { data?: { detail?: string; title?: string }; error?: string };
  return e?.data?.detail ?? e?.data?.title ?? e?.error ?? "Something went wrong";
}

export const isNotFound = (err: unknown): boolean => (err as { status?: unknown } | undefined)?.status === 404;
