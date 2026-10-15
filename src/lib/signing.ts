/**
 * Request signing, client side. Mirrors jabali-be/src/common/request-signing: the same canonical text, HMAC-SHA256,
 * base64url. The secret ships in the app, so this proves "built from our app" to the API, not "trusted caller"; login
 * tokens still do the real authorisation.
 */

export const SIGNING_ALG = "HMAC-SHA256";
const VERSION = "JABALI-SIGN-V1";
export const UNSIGNED_BODY = "UNSIGNED-MULTIPART";

export interface SignInput {
  method: string;
  /** Path and query exactly as sent, e.g. `/api/v1/store/orders?x=1`. */
  url: string;
  /** Request body as text. Ignored for multipart. */
  body: string;
  multipart: boolean;
}

export interface SignOptions {
  clientId: string;
  key: string;
  now?: number;
  nonce?: string;
  subtle?: SubtleCrypto;
}

const enc = new TextEncoder();

const hex = (buf: ArrayBuffer): string => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

function base64url(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 18 random bytes, base64url: 24 characters. */
export function randomNonce(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return base64url(bytes.buffer);
}

const keys = new Map<string, Promise<CryptoKey>>();

function hmacKey(subtle: SubtleCrypto, secret: string): Promise<CryptoKey> {
  let k = keys.get(secret);
  if (!k) {
    k = subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    keys.set(secret, k);
  }
  return k;
}

/** The headers to add to one request. */
export async function signRequest(input: SignInput, o: SignOptions): Promise<Record<string, string>> {
  const subtle = o.subtle ?? globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Request signing needs a secure context (https or localhost).");
  const timestamp = String(o.now ?? Date.now());
  const nonce = o.nonce ?? randomNonce();
  const contentSha256 = input.multipart ? UNSIGNED_BODY : hex(await subtle.digest("SHA-256", enc.encode(input.body)));
  const text = [VERSION, input.method.toUpperCase(), input.url, timestamp, nonce, o.clientId, contentSha256].join("\n");
  const signature = base64url(await subtle.sign("HMAC", await hmacKey(subtle, o.key), enc.encode(text)));
  return {
    "X-Client-Id": o.clientId,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Content-Sha256": contentSha256,
    "X-Signature": signature,
    "X-Signature-Alg": SIGNING_ALG,
  };
}
