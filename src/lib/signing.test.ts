import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { test } from "node:test";
import { SIGNING_ALG, UNSIGNED_BODY, randomNonce, signRequest } from "./signing.ts";

const opts = { clientId: "storefront", key: "k".repeat(40), now: 1_800_000_000_000, nonce: "AbCdEfGhIjKlMnOp12" };

test("the signature matches what the server computes for the same request", async () => {
  const body = '{"a":1}';
  const h = await signRequest({ method: "post", url: "/api/v1/store/orders?x=1", body, multipart: false }, opts);
  const digest = createHash("sha256").update(body).digest("hex");
  const text = ["JABALI-SIGN-V1", "POST", "/api/v1/store/orders?x=1", "1800000000000", opts.nonce, "storefront", digest].join("\n");
  assert.equal(h["X-Content-Sha256"], digest);
  assert.equal(h["X-Signature"], createHmac("sha256", opts.key).update(text).digest("base64url"));
  assert.equal(h["X-Signature-Alg"], SIGNING_ALG);
  assert.equal(h["X-Client-Id"], "storefront");
});

test("a different body, path or method gives a different signature", async () => {
  const base = { method: "POST", url: "/a", body: "x", multipart: false };
  const sig = async (over: object) => (await signRequest({ ...base, ...over }, opts))["X-Signature"];
  const ref = await sig({});
  assert.notEqual(ref, await sig({ body: "y" }));
  assert.notEqual(ref, await sig({ url: "/b" }));
  assert.notEqual(ref, await sig({ method: "PUT" }));
});

test("multipart bodies are marked unsigned rather than hashed", async () => {
  const h = await signRequest({ method: "POST", url: "/upload", body: "ignored", multipart: true }, opts);
  assert.equal(h["X-Content-Sha256"], UNSIGNED_BODY);
});

test("nonces are unique, url-safe and long enough", () => {
  const seen = new Set(Array.from({ length: 50 }, randomNonce));
  assert.equal(seen.size, 50);
  for (const n of seen) assert.match(n, /^[A-Za-z0-9_-]{16,64}$/);
});
