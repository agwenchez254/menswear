import { createHash } from "node:crypto";

/** CSP source expression for an inline script body. */
export const scriptHash = (body) => `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;

/** Bodies of inline <script> elements (not external ones, not empty ones). */
export function inlineScripts(html) {
  const found = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (!/\bsrc\s*=/.test(m[1]) && m[2].trim()) found.push(m[2]);
  }
  return found;
}

/** The API's origin for CSP. In strict (production) mode anything but https is an error. */
export function apiOriginOf(url, strict) {
  let u;
  try {
    u = new URL(url);
  } catch {
    throw new Error(`VITE_API_URL is not a valid URL: ${url}`);
  }
  if (strict && u.protocol !== "https:") throw new Error(`VITE_API_URL must use https in a production build (got ${url})`);
  return u.origin;
}

export function buildCsp({ apiOrigin, scriptHashes, strict }) {
  const directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'", ...scriptHashes],
    // Inline style attributes come from motion and CMS focal points; documented exception.
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", "data:", "https://images.unsplash.com", apiOrigin],
    // Vite inlines small woff2 files as data: URIs.
    ["font-src", "'self'", "data:"],
    ["connect-src", "'self'", apiOrigin],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ];
  if (strict) directives.push(["upgrade-insecure-requests"]);
  return directives.map((d) => d.join(" ")).join("; ");
}

/** Contents of Netlify's `_headers` file. */
export function buildHeadersFile({ apiOrigin, scriptHashes, strict }) {
  const csp = buildCsp({ apiOrigin, scriptHashes, strict });
  return [
    "/*",
    `  Content-Security-Policy: ${csp}`,
    "  Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "  Cross-Origin-Opener-Policy: same-origin",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/index.html",
    "  Cache-Control: no-cache",
    "",
  ].join("\n");
}
