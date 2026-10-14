import assert from "node:assert/strict";
import { test } from "node:test";
import { apiOriginOf, buildCsp, buildHeadersFile, inlineScripts, scriptHash } from "./headers.mjs";

const api = "https://api.example.com";

test("scriptHash is a CSP sha256 source", () => {
  assert.match(scriptHash("alert(1)"), /^'sha256-[A-Za-z0-9+/]+=*'$/);
});

test("inlineScripts finds inline bodies and skips external and empty scripts", () => {
  const html = `<script>var a=1;</script><script type="module" src="/x.js"></script><script> </script><script type="module">import "/y"</script>`;
  assert.deepEqual(inlineScripts(html), ["var a=1;", 'import "/y"']);
});

test("the CSP never allows unsafe-eval or unsafe-inline for scripts", () => {
  const csp = buildCsp({ apiOrigin: api, scriptHashes: ["'sha256-abc='"], strict: true });
  const script = csp.split("; ").find((d) => d.startsWith("script-src ")) ?? "";
  assert.ok(!script.includes("unsafe-eval"));
  assert.ok(!script.includes("unsafe-inline"));
  assert.ok(script.includes("'self'") && script.includes("'sha256-abc='"));
});

test("the CSP lists the API origin for data and images, and locks down framing and plugins", () => {
  const csp = buildCsp({ apiOrigin: api, scriptHashes: [], strict: true });
  assert.match(csp, /connect-src 'self' https:\/\/api\.example\.com/);
  assert.match(csp, /img-src 'self' data: https:\/\/images\.unsplash\.com https:\/\/api\.example\.com/);
  for (const d of ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "default-src 'self'"]) assert.ok(csp.includes(d), d);
});

test("upgrade-insecure-requests only in strict (production) mode", () => {
  assert.ok(buildCsp({ apiOrigin: api, scriptHashes: [], strict: true }).includes("upgrade-insecure-requests"));
  assert.ok(!buildCsp({ apiOrigin: "http://localhost:5000", scriptHashes: [], strict: false }).includes("upgrade-insecure-requests"));
});

test("the headers file carries the security headers and cache rules", () => {
  const file = buildHeadersFile({ apiOrigin: api, scriptHashes: [], strict: true });
  for (const h of [
    "Content-Security-Policy:",
    "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy:",
    "Cross-Origin-Opener-Policy: same-origin",
  ]) {
    assert.ok(file.includes(h), h);
  }
  assert.match(file, /\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
  assert.match(file, /\/index\.html\n\s+Cache-Control: no-cache/);
});

test("apiOriginOf returns the origin and enforces https in strict mode", () => {
  assert.equal(apiOriginOf("https://api.example.com/api/v1", true), "https://api.example.com");
  assert.equal(apiOriginOf("http://localhost:5000/api/v1", false), "http://localhost:5000");
  assert.throws(() => apiOriginOf("http://api.example.com/api/v1", true), /https/);
  assert.throws(() => apiOriginOf("not a url", false), /valid/);
});
