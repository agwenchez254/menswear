# Storefront security hardening (ASVS Level 2, mapped to ISO 27001): design

Date: 2026-10-14
Repos: `gift-shoe-app` (storefront), `jabali-be` (the public `/store/*` API and customer auth the storefront depends on).
Sub-project 2 of 2; builds on `2026-10-14-customer-auth-design.md`.

## Goal and honest scope

Implement the **technical** controls an ISO/IEC 27001:2022 Annex A and ISO/IEC 27034 assessment expects of a web storefront, using **OWASP ASVS 4.0 Level 2** as the concrete checklist, and deliver a control matrix showing which are implemented and which are organisational gaps.

This does **not** make the system ISO certified or compliant. Certification covers the organisation (ISMS scope, policies, risk assessment, supplier and incident management, internal audit), which code cannot supply. The matrix lists those items as "Organisational gap" so they are not mistaken for done.

## Baseline found on 2026-10-14

- Storefront: no security headers or CSP (`netlify.toml` has only a build command and an SPA redirect); an inline theme script in `index.html`; 0 production-dependency vulnerabilities (`npm audit --omit=dev`).
- Backend: `helmet()` defaults only; CORS allow-list via `CORS_ORIGINS`; JWT secret length enforced (32+); global `ValidationPipe` (whitelist, forbid unknown); RFC 7807 errors; **no rate limiting**; `trust proxy` hard-coded to 1; Swagger enabled unconditionally; 5 production-dependency vulnerabilities (3 high, 2 moderate) via `@nestjs/swagger`/`js-yaml`.

## 1. Storefront controls

1. **Security headers** for the deployed site, generated at build time into `dist/_headers` by `scripts/write-headers.mjs` (pure function `buildHeaders({apiOrigin, scriptHashes})`, unit-tested):
   - `Content-Security-Policy`: `default-src 'self'`; `script-src 'self'` plus the SHA-256 of the one inline theme script (no `'unsafe-inline'`, no `'unsafe-eval'`); `style-src 'self' 'unsafe-inline'` (inline `style` attributes from motion and CMS focal points; documented exception); `img-src 'self' data: https://images.unsplash.com <API origin>`; `font-src 'self' data:` (Vite inlines small woff2 files as data URIs); `connect-src 'self' <API origin>`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`.
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone, geolocation, payment, USB; `Cross-Origin-Opener-Policy: same-origin`.
   - Caching: `index.html` `no-cache`; hashed `/assets/*` `public, max-age=31536000, immutable`.
   - The API origin comes from `VITE_API_URL`; the build fails if it is not `https:` in a production build.
2. **Untrusted CMS content.** Image URLs from blocks, categories and products pass `safeImageUrl` (allows `https:` and the API's own `/uploads/` only; anything else renders the placeholder). A test fails the build if `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` or `document.write` appear in `src`.
3. **Client data handling.** Customer access token in memory only; refresh token in `localStorage` (documented risk, mitigated by the CSP); no tokens, emails or phone numbers in `console` output or URLs; no secrets in `VITE_*` variables (a build-time check rejects names containing `SECRET`, `PASSWORD`, `PRIVATE`).
4. **Error handling.** User-facing errors stay generic; server `detail` is shown only for validation errors, never stack traces or internals.
5. **Supply chain.** `npm audit --omit=dev --audit-level=high` as a script and a documented CI gate; `npm ci` in deploys; lockfile committed.

## 2. Backend controls (`jabali-be`)

1. **Rate limiting** with `@nestjs/throttler`: global default 120 requests/minute/IP; `POST /store/auth/login` 10/minute per IP and 5/minute per email; `register` 5/minute per IP; `refresh` 30/minute per IP; `/store/events` capped at 5 concurrent streams per IP (resource exhaustion). 429 responses use the existing problem+json format and a `Retry-After` header. The client IP honours a configurable `TRUST_PROXY_HOPS` (default 1).
2. **Headers.** `helmet` configured explicitly: HSTS (1 year, includeSubDomains), `Referrer-Policy: no-referrer`, a strict API CSP (`default-src 'none'; frame-ancestors 'none'`), `Cross-Origin-Resource-Policy: cross-origin` kept only for `/uploads`. Swagger UI is **disabled when `NODE_ENV=production`**.
3. **Uploads** (`/uploads`): `X-Content-Type-Options: nosniff` and `Content-Security-Policy: sandbox` so an uploaded file can never run script in the API origin.
4. **Request limits.** JSON body limit 100 kB; `ValidationPipe` unchanged.
5. **CORS.** Startup validation rejects `*` and non-`https:` origins when `NODE_ENV=production`.
6. **Authentication hardening** (builds on sub-project 1): argon2id with explicit parameters (memory 64 MiB, time 3, parallelism 4, matching or exceeding the current staff setting), common-password denylist, lockout, refresh rotation with reuse detection, token-type separation.
7. **Security event logging.** Structured JSON log lines for register, login success and failure, lockout, refresh reuse, token-type rejection and rate-limit hits: event name, timestamp, IP, account id (never the password, token or full email). Existing admin writes already go to `audit_log`.
8. **Dependencies.** Resolve the 5 production vulnerabilities (upgrade `@nestjs/swagger` to a fixed release, or the least risky fix); `npm audit --omit=dev --audit-level=high` passes.
9. **Injection review.** A test greps for `$queryRawUnsafe` and `$executeRawUnsafe` with interpolated input in `src` (excluding `test/` and `prisma/`); today's raw queries use tagged templates.

## 3. Control matrix (`docs/security/CONTROL-MATRIX.md`, in `jabali-be`)

One table: control, ASVS 4.0 requirement(s), ISO/IEC 27001:2022 Annex A control(s), where implemented (file), verification (test or check), status (`Implemented` | `Partial` | `Organisational gap`). Mapping used: A.5.15/A.5.16/A.5.17/A.8.5 (identity, authentication), A.8.3 (access restriction), A.8.8 (vulnerability management), A.8.9 (configuration), A.8.12 (data leakage), A.8.15/A.8.16 (logging, monitoring), A.8.20/A.8.21 (network and web security), A.8.24 (cryptography), A.8.25/A.8.26/A.8.28 (secure development, requirements, coding).

Organisational gaps listed explicitly (not coded): ISMS scope and policies, risk assessment and treatment, supplier assessment, incident response plan, backup and disaster recovery testing, penetration test, edge WAF and DDoS protection, secrets manager and rotation, central log shipping and alerting, customer MFA, email verification and password reset, phone verification.

## 4. Testing

- Backend e2e: response headers present on `/store/*`; 429 after the configured limit on login, with `Retry-After`; per-email login throttle; SSE concurrency cap; Swagger absent in production mode; `/uploads` responses carry `nosniff` and `sandbox`; CORS rejects a disallowed origin.
- Backend unit: CORS config validation, password denylist, security-log redaction.
- Storefront (`node --test`): `buildHeaders` output (no `'unsafe-eval'`, no `'unsafe-inline'` in `script-src`, API origin present, hash present), `safeImageUrl` cases, source-scan test for forbidden APIs, env-name check. `tsc`, `vite build`, and a check that `dist/_headers` exists and the inline script's hash matches.
- `npm audit --omit=dev --audit-level=high` clean in both repos.

## 5. Risks

- The CSP `style-src 'unsafe-inline'` exception remains (documented). Removing it needs nonce-based styles and is a follow-up.
- Rate limiting is per process (in-memory store). Behind several API instances it needs a shared store; same single-instance constraint as the realtime event bus.
- Header enforcement depends on the host honouring `_headers` (Netlify does); other hosts need the same headers configured.
