# Account tabs, order history and printable receipt with optional VAT

Date: 2026-10-15. Repos: `jabali-be` (API), `jabali-dashboard` (settings), `gift-shoe-app` (storefront).

## Goal

A signed-in customer sees their account in tabs (**Profile**, **Orders**), opens any of their orders to see its full details, and prints a receipt. The shop owner can switch VAT on in the dashboard; when on, new orders carry a VAT breakdown that appears at checkout and on the receipt.

## Decisions taken with the owner

- The receipt is a **plain printable receipt**. It is not a KRA eTIMS tax invoice (no control-unit number or QR code). It says so in its footer. Order tax fields are stored in a way eTIMS can be added later.
- Shelf prices **already include VAT** (normal for Kenyan retail). VAT is extracted from the total, never added on top, so a customer never pays more than the displayed price.
- VAT is optional and off by default. Off means nothing changes anywhere.

## Kenyan VAT rules applied

Sourced from secondary guides, not the Act text, so the owner should confirm with their accountant.

- Standard rate 16%. The rate is a setting (default 16) so a change in law needs no deploy.
- The seller's **KRA PIN** and business name must appear on the receipt, so VAT cannot be enabled without them.
- Registration status is the owner's responsibility: they enable VAT only if VAT-registered. The registration threshold is not hard-coded because sources disagree (KSh 5m vs 8m).
- All lines, the delivery fee and the gift fee are treated as standard-rated. Zero-rated and exempt products are out of scope (see below).

## Design

### Setting `vat` (jabali-be `SETTING_SCHEMAS`)

```
{ enabled: boolean, ratePercent: number (0 < r <= 30, up to 2 decimals),
  businessName: string (<=120), kraPin: string, address: string (<=300) }
```

`kraPin` must match `^[AP]\d{9}[A-Z]$`. When `enabled` is true, `businessName` and `kraPin` are required (zod refine). Absent setting = disabled. Setting changes use the existing settings endpoint, audit log and cache invalidation.

### Money

`vatAmount = round(total * rate / (100 + rate))`, with total in whole KES after discounts, including delivery and gift fees. `net = total - vatAmount`. One pure function `extractVat(total, ratePercent)` in `src/orders/vat.ts`, with unit tests (boundaries: 0, 1, 116, rounding half up, rate 0, large totals).

### Order snapshot

New nullable columns on `Order`: `vatRateBp Int?` (rate in basis points, so 16% = 1600), `vatAmount Int?`, `vatSeller Json?` (`{ businessName, kraPin, address }`). Written at checkout in the same transaction as the order, from the setting at that moment. Existing orders and orders placed while VAT is off keep nulls and show no VAT. Later setting changes never alter old receipts. Migration is additive, no backfill.

### API (jabali-be)

- `GET /store/me/orders?page&limit` returns the signed-in customer's orders, newest first: number, status, payment status, total, line count, createdAt.
- `GET /store/me/orders/:number` returns full detail: lines (name, variant, qty, unit price, line total), subtotal, discount, delivery fee, gift fee if any, total, VAT block (`{ ratePercent, amount, net, seller }` or null), delivery/pickup details, contact name and phone, payments (provider, status), status events.
- Both use `CustomerAuthGuard` and are scoped by the account's own customer. Another customer's order number answers **404**, same as an unknown one. Responses never include other people's data. The existing guest-record rule holds: name and email shown are the account's own.
- `POST /store/quote` (existing) gains `vat: { ratePercent, amount } | null` when VAT is enabled, so checkout can show "incl. VAT".
- Public settings endpoint exposes `vat.enabled` and `vat.ratePercent` only. PIN and address reach the storefront only inside an order's snapshot.

### Dashboard (jabali-dashboard)

A **Tax (VAT)** card on the settings page: enable switch, rate, business name, KRA PIN, address, with inline validation mirroring the API and a note that prices are treated as VAT-inclusive. The order detail page shows the VAT line when present.

### Storefront (gift-shoe-app)

- `/account` becomes a tabbed page: **Profile** (existing details, edit name via `PATCH /store/me`, sign out) and **Orders**. Tab is in the URL (`/account?tab=orders`) so refresh and back work.
- **Orders tab:** list with status chips, empty state, pagination. Each row links to `/account/orders/:number`.
- **Order detail:** items, totals, VAT line when present, delivery or pickup info, payment status, status timeline, and a **Print receipt** button.
- **Receipt:** seller header (name, KRA PIN, address) when VAT data exists, order number and date, customer name, items, subtotal, discount, delivery, VAT included, total, payment method and status. Heading is "Receipt" when payment is paid, otherwise "Order summary (unpaid)". Cancelled or refunded orders show that status prominently. Footer: "Not a KRA eTIMS tax invoice." Printing uses `window.print()` with a `@media print` stylesheet that hides header, footer, tabs and buttons and fits A4 and thermal widths. No external assets, so the strict CSP is unchanged.
- Checkout totals show "incl. VAT (16%) KES x" only when the quote carries VAT.
- Order data goes through RTK Query with a `CustomerOrders` tag, invalidated after checkout and by the existing realtime events.

## Errors and edge cases

- VAT enabled with missing PIN: API rejects the setting (400, field-level errors).
- Setting turned off after orders carry VAT: old receipts still show their snapshot.
- Unknown or someone else's order: 404. Expired session: existing refresh flow, then sign-in prompt.
- Very large order lists: server-side pagination, default 10, max 50.
- Receipt for an order with zero lines is impossible (checkout requires lines).

## Testing

- Unit: `extractVat`, setting schema (PIN regex, required fields when enabled), order response mapper.
- E2E (jabali-be): enable VAT then checkout stores snapshot; disabled stores nulls; changing the rate later leaves the old order unchanged; list and detail return only own orders; other customer's number is 404; unauthenticated is 401; pagination limits.
- Storefront (vitest): order adapter, tab routing from the URL, receipt renders VAT and seller only when present, unpaid heading, print button calls `window.print`.
- Manual: print preview in a browser at A4 for one VAT order and one non-VAT order.

## Out of scope

eTIMS integration, per-product VAT class (zero-rated and exempt goods), credit notes for refunds, emailing the receipt, PDF download (print to PDF works), customer address book UI.
