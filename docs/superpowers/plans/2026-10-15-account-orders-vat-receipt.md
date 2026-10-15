# Account tabs, order history and printable VAT receipt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, no subagents, no worktrees, per the owner). Steps use checkbox syntax.

**Goal:** Customers get Profile and Orders tabs, order detail and a printable receipt; the owner can enable VAT from the dashboard.

**Architecture:** VAT is a site setting. At checkout the rate and seller details are snapshotted on the order (VAT-inclusive pricing, VAT extracted from the total). New customer-scoped order endpoints feed new storefront pages. Dashboard gets a settings card.

**Tech Stack:** NestJS 11 + Fastify + Prisma + zod (jabali-be); React + RTK Query + vitest (gift-shoe-app); jabali-dashboard (React).

**Spec:** `gift-shoe-app/docs/superpowers/specs/2026-10-15-account-orders-vat-receipt-design.md`

## Global Constraints

- Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never bare `git commit` or `git add -A`: use pathspec commits (other sessions' WIP is in all three trees). Do not touch or commit `.env.example`.
- jabali-be: run jest with `--runInBand`, `RESEND_API_KEY=` (empty) in env, `NODE_OPTIONS=--max-old-space-size=2048`. Migrations are additive. Dev DB is not migrated by me except `migrate deploy` of mine after asking is unnecessary: test DB `jabali_test` migrates itself in global setup.
- gift-shoe-app: never `npm run build`; verify with `npx tsc --noEmit`, `npm test`, `npx vite build --outDir "$TEMP/gsa-dist" --emptyOutDir`.
- Money is whole KES integers. Rate is stored in basis points (16% = 1600).
- Another customer's order number answers 404, never 403.
- PIN and address are never in public settings; only in an order's own snapshot.

## Review Focus

- Settings read by the public endpoints (`/store/settings`, `/store/home`) must not leak `kraPin`/`address` (test).
- Order placed with VAT on keeps its snapshot after the rate changes or VAT is turned off (test).
- A customer cannot read another customer's order, including by guessing the number (test).
- Order numbers are case-insensitive in the URL; list pagination is bounded (test).
- Receipt shows no VAT/seller block for orders without a snapshot, and says "unpaid" for unpaid orders (test).

---

### Task 1: VAT maths and `vat` setting (jabali-be)

**Files:** Create `src/orders/vat.ts`, `src/orders/vat.spec.ts`; modify `src/content/settings.service.ts`; test `src/content/settings.service.spec.ts` (create if absent).

**Interfaces:** Produces `extractVat(total: number, ratePercent: number): { vat: number; net: number }`, `VatSettingSchema`, `type VatSetting = { enabled: boolean; ratePercent: number; businessName: string; kraPin: string; address: string }`, `publicSettings(all: Record<string, unknown>)` (redacts `vat` to `{ enabled, ratePercent }`).

- [ ] Write failing unit tests: `extractVat(116,16)` = `{vat:16,net:100}`; `extractVat(0,16)` = `{0,0}`; `extractVat(1,16)` = `{vat:0,net:1}`; `extractVat(1000,16)` = vat 138 (137.93 rounds up); rate 0 = vat 0; vat + net always equals total over totals 0..500 at rates 16 and 8. Schema: disabled with empty strings passes; enabled needs `businessName` and a PIN matching `^[AP]\d{9}[A-Z]$` (reject `A12`), rate in (0, 30]; `publicSettings` removes `kraPin`, `address`, `businessName` and keeps other keys.
- [ ] Run: `RESEND_API_KEY= npx jest --selectProjects unit --runInBand --testPathPattern "vat|settings.service"`. Expected: FAIL (modules missing).
- [ ] Implement `vat.ts`: `const vat = Math.round((total * ratePercent) / (100 + ratePercent))` guarded for `total <= 0` or `ratePercent <= 0`; `net = total - vat`. Add `vat` to `SETTING_SCHEMAS` (zod object with `.refine` for the enabled case, error path on the offending field), description in `SETTING_DESCRIPTIONS`, and `publicSettings`.
- [ ] Run the same command. Expected: PASS.
- [ ] Commit (pathspec): `feat: VAT maths and vat site setting`.

### Task 2: Order VAT snapshot, quote and public settings (jabali-be)

**Files:** Modify `prisma/schema.prisma` (Order: `vatRateBp Int?`, `vatAmount Int?`, `vatSeller Json?`), create `prisma/migrations/20261015120000_order_vat/migration.sql`, modify `src/orders/orders.service.ts` (`createOrderTx`, `view`), `src/cart/cart.service.ts` + `src/cart/models/cart.model.ts` (quote `vat`), `src/content/content.controller.ts` (use `publicSettings` in `/store/settings` and `/store/home`); test `test/vat.e2e-spec.ts`.

**Interfaces:** Consumes Task 1. Produces order view field `vat: { ratePercent: number; amount: number; net: number; seller: { businessName: string; kraPin: string; address: string } } | null` and quote field `vat: { ratePercent: number; amount: number } | null`.

- [ ] Write failing e2e (helpers in `test/helpers`): staff sets `vat` via `PUT /admin/settings/vat`; a verified customer checks out; response `order.vat` equals `{ratePercent:16, amount: extractVat(total,16).vat, net, seller}`; DB row has `vatRateBp = 1600`; change rate to 8 and turn off, re-read the order: unchanged; an order placed while off has `vat: null`; quote includes `vat` while on and `null` while off; `GET /store/settings` and `GET /store/home` contain `vat.enabled`/`ratePercent` and not `kraPin`.
- [ ] Run `RESEND_API_KEY= NODE_OPTIONS=--max-old-space-size=2048 npx jest --selectProjects e2e --runInBand --forceExit --testPathPattern vat.e2e`. Expected: FAIL.
- [ ] Add columns, migration SQL (three `ALTER TABLE "orders" ADD COLUMN`), `npx prisma generate` (if EPERM from the locked engine DLL, rename `node_modules/.prisma/client/query_engine-windows.dll.node` aside, then generate).
- [ ] In `createOrderTx` read the `vat` setting through `tx.siteSetting`, parse with `VatSettingSchema`; if enabled write the three columns from `extractVat(pricing.total, rate)`. In `view` add the `vat` block from the columns (null when `vatRateBp` is null). In quote `format` accept the setting and add `vat`. Switch the two public endpoints to `publicSettings`.
- [ ] Run the e2e and the unit suite. Expected: PASS (known unrelated failures: `config.spec.ts` RESEND_API_KEY, `guards.spec.ts` customerAccount mock, SMTP e2e).
- [ ] Commit (pathspec): `feat: snapshot VAT on orders, expose it in quotes, keep seller details out of public settings`.

### Task 3: Customer order endpoints (jabali-be)

**Files:** Modify `src/orders/orders.service.ts` (`listForCustomer`, `getForCustomer`), `src/orders/orders.controller.ts` or `src/customer-auth/customer-auth.controller.ts` (routes under `store/me/orders`), `src/orders/orders.dto.ts` (`MyOrdersQuery` with `page`, `limit` 1..50 default 10); test `test/customer-orders-history.e2e-spec.ts`.

**Interfaces:** Produces `GET /store/me/orders` -> `{ items: { number, status, paymentStatus, method, total, lineCount, createdAt }[], total, page, limit }` and `GET /store/me/orders/:number` -> the order view (Task 2) plus `timeline` (customer-visible events as in `track`). Guard: `CustomerAuthGuard`; scope: `customerId` from the token.

- [ ] Write failing e2e: customer A with two orders lists both newest first; B sees none of A's; `GET` A's order as B is 404; unknown number 404; lowercase number works; no token 401; `limit=500` is 400; pagination `limit=1&page=2` returns the older order; detail includes lines, vat, payments, contact fields and never another person's name/email (account's own name).
- [ ] Run (as Task 2). Expected: FAIL (404 routes).
- [ ] Implement service methods using `prisma.order.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' }, skip, take })` and `findFirst({ where: { number: number.toUpperCase(), customerId } })`; reuse `view` plus timeline; apply the account's own name/email like checkout does. Register routes before `@Get()` on `store/me` so `orders` isn't shadowed.
- [ ] Run e2e + unit. Expected: PASS.
- [ ] Commit (pathspec): `feat: customers can list and open their own orders`.

### Task 4: Dashboard VAT card (jabali-dashboard)

**Files:** Modify `src/pages/SiteSettings.tsx` (add "Tax (VAT)" card), the order detail page (VAT line when `vat` present), and the settings types if any. Test with the dashboard's existing test runner if one exists, otherwise `npx tsc --noEmit`.

- [ ] Read `SiteSettings.tsx` and copy the pattern of an existing card (e.g. giftFee/announcement): enable switch, rate (number, step 0.01), business name, KRA PIN (uppercase, regex hint), address; helper text "Prices are treated as VAT-inclusive. Enable only if VAT-registered. This receipt is not an eTIMS tax invoice."; client validation mirrors the API; save through the existing settings mutation to key `vat`.
- [ ] Order detail: add "VAT (16%) included: KES x" under totals when `order.vat` exists.
- [ ] `npx tsc --noEmit` in `jabali-dashboard`. Expected: no new errors.
- [ ] Commit (pathspec, only my files): `feat: VAT settings card and VAT line on order detail`.

### Task 5: Storefront data layer (gift-shoe-app)

**Files:** Modify `src/models/order.ts` (`vat?: OrderVat | null`, `status`, `timeline`), `src/api/orderAdapter.ts` (`toOrder` maps `vat`; new `toOrderSummary`), `src/api/orders.ts` (`getMyOrders`, `getMyOrder` queries, tag `Orders`), `src/api/tags.ts` (add `"Orders"`), `src/api/quote.ts` (quote `vat`), `src/api/settings.ts` (public `vat`); tests `src/api/orderAdapter.test.ts`.

**Interfaces:** Produces `OrderVat = { ratePercent: number; amount: number; net: number; seller: { businessName: string; kraPin: string; address: string } }`, `OrderSummary`, hooks `useGetMyOrdersQuery({ page, limit })`, `useGetMyOrderQuery(number)`.

- [ ] Failing vitest cases: `toOrder` maps `vat` and leaves `null` when absent; `toOrderSummary` maps fields and payment status fallback.
- [ ] `npx vitest run src/api/orderAdapter.test.ts`. Expected: FAIL; implement; Expected: PASS.
- [ ] Add queries (`providesTags: ['Orders']`; `placeOrder` and realtime events invalidate `Orders`).
- [ ] Commit (pathspec): `feat: storefront order history data layer with VAT`.

### Task 6: Account tabs, order detail, receipt and print (gift-shoe-app)

**Files:** Modify `src/features/auth/AccountPage.tsx` (tabs via `useSearchParams`, `?tab=orders`), create `src/features/account/ProfileTab.tsx`, `OrdersTab.tsx`, `OrderDetailPage.tsx`, `Receipt.tsx`, `receipt.css` (or Tailwind `print:` utilities plus a small `@media print` block in `src/index.css`), modify `src/config/routes.ts` (`accountOrder: "/account/orders/:number"`, `accountOrderPath`), `src/app/App.tsx` (lazy route under `RequireCustomer`), `src/features/checkout/CheckoutPage.tsx` (VAT line from quote); tests `src/features/account/*.test.tsx`.

- [ ] Failing component tests: tab selected from the URL and switching updates it; Orders tab shows empty state and rows with links; `Receipt` with `vat` shows seller name, PIN, "VAT (16%) included" and net; without `vat` shows neither; paid -> heading "Receipt", unpaid -> "Order summary (unpaid)"; footer text "Not a KRA eTIMS tax invoice"; Print button calls `window.print`.
- [ ] `npx vitest run src/features/account`. Expected: FAIL; implement; Expected: PASS.
- [ ] Print CSS: hide `header`, `footer`, tab bar and `.no-print`; receipt container full width, black on white, `@page { margin: 12mm }`, readable at 80mm.
- [ ] Profile tab: existing details, edit name with `PATCH /store/me` (existing `useUpdateMeMutation` if present, else add), sign out.
- [ ] `npx tsc --noEmit`, `npm test`, `npx vite build --outDir "$TEMP/gsa-dist" --emptyOutDir`. Expected: all pass.
- [ ] Commit (pathspec, only my files): `feat: account tabs, order history, order detail and printable receipt`.

### Task 7: Verify end to end

- [ ] Start jabali-be from a temp tsc build on port 5055 (as for the Fastify check), with the test DB or dev DB; enable VAT via admin API, place an order as a customer, fetch list and detail with curl, confirm 404 for another customer.
- [ ] Run storefront dev build against it if practical; at minimum the Vite production build passes.
- [ ] Update the spec only if behaviour deviated. Report deviations as rulings.
