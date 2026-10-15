import { signRequest } from "./signing";

const CLIENT_ID = "storefront";

/** Set VITE_SIGNING_KEY at build time. The fallback only exists for local development. */
const KEY = (import.meta.env.VITE_SIGNING_KEY as string | undefined) ?? (import.meta.env.DEV ? "dev-only-storefront-signing-key-not-a-secret" : "");

/** `fetch` that signs the request for the API. Pass this to fetchBaseQuery as `fetchFn`. */
export async function signedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const req = new Request(input, init);
  const url = new URL(req.url);
  const multipart = (req.headers.get("content-type") ?? "").startsWith("multipart/");
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody && !multipart ? await req.clone().text() : "";
  const headers = new Headers(req.headers);
  for (const [k, v] of Object.entries(await signRequest({ method: req.method, url: url.pathname + url.search, body, multipart }, { clientId: CLIENT_ID, key: KEY }))) headers.set(k, v);
  return fetch(new Request(req, { headers }));
}
