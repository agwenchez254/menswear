# Storefront on Jabali API with realtime content: design

Date: 2026-10-14
Repos: `gift-shoe-app` (storefront, package `jabali-menswear`), `jabali-be` (NestJS API), `jabali-dashboard` (admin, unchanged)

## Goal

The storefront reads its catalogue and home content from `jabali-be` through RTK Query, structured like `jabali-dashboard`. Content is server-driven (not hardcoded). When an editor publishes or edits in the dashboard, open storefront tabs update without a reload.

## Scope

In: products, categories, home blocks (hero, trust, gift demo, category tiles, titles), testimonials, site settings, delivery zones. Read-only. Realtime updates.

Out (follow-up): cart quote, checkout, order creation, M-Pesa, order confirmation, SSR/SEO. The zustand `cart` and `gender` stores stay.

Assumption: "server side" means server-driven content, not server-side rendering.

## 1. Storefront data layer (`gift-shoe-app`)

- Dependencies: `@reduxjs/toolkit`, `react-redux`.
- `src/api/baseApi.ts`: `createApi` + `fetchBaseQuery({ baseUrl: \`${VITE_API_URL}/store\` })`, default `http://localhost:5000/api/v1`. No auth or refresh (public endpoints). Tags: `Home, Product, Category, Content, Settings, Delivery, Testimonial`. Exports an `errorMessage` helper for problem+json, same as the dashboard.
- Endpoint files via `injectEndpoints`:
  - `src/api/catalogue.ts`: `getCategories({gender})`, `getProducts(filters, cursor)`, `getProduct(slug)`.
  - `src/api/home.ts`: `getHome(gender)` against `/store/home` (blocks, testimonials, categories, topProducts, settings in one call), `getSettings`.
  - `src/api/delivery.ts`: `getZones`.
- `src/store/index.ts` (`configureStore`, `baseApi.reducer` + middleware), typed hooks in `src/store/hooks.ts`, `<Provider>` in `main.tsx`.
- Adapters in `src/api/adapters.ts` map API shapes to the existing UI models (`colours`→`colors`, `image` URL, `slug` as route key, `inStock`). UI components keep their current props where possible.
- Remove hardcoded `data/products.ts`, `data/categories.ts`, `data/delivery.ts`, `features/home/config.ts` content. Pages render skeletons while loading and an error state with retry. `Photo` accepts a media URL.
- Product routes use `slug`.

## 2. Home content mapping (`jabali-be`)

Home content is JSON blocks with conventional keys per gender:

| Key | Kind | Data |
|---|---|---|
| `home.hero` | `hero` | lines[2], sub, cta, imageUrl, alt, pos, featuredSlug |
| `home.trust` | `rich_text` | items[{icon, title, text}] (icon = name from a fixed set) |
| `home.titles` | `rich_text` | catTitle, topTitle |
| `home.gift` | `gift_promo` | productSlug, color, wrap, ribbon, message, from, to |
| `home.categories` | `category_tiles` | ordered slugs, with per-tile image override |

Testimonials come from the testimonial endpoints (lead = first, others = rest).

The seed gets these blocks (published) with today's copy so the site is unchanged on day one. No schema migration is needed because existing `ContentKind` values are reused.

Decision: Tailwind grid placement classes stay in the storefront, keyed by category slug. The CMS controls order, label, tagline and image only. A category with no placement entry gets a default tile.

## 3. Realtime via SSE (`jabali-be`)

- `StoreEventsService`: an in-process RxJS `Subject<{tags: string[]; at: number}>`.
- `GET /store/events` (public, `text/event-stream`): streams events, heartbeat comment every 25s, `X-Accel-Buffering: no`. Sets `id` per event.
- Trigger: `AuditInterceptor`, which already runs for every successful admin write and calls `cache.invalidate()`. After the invalidation completes it emits tags from an `entity → tags` map:
  - `content_block`, `page` → `Home, Content`
  - `product`, `variant`, `colour` → `Product, Home`
  - `category` → `Category, Home`
  - `testimonial` → `Testimonial, Home`
  - `setting` → `Settings, Home`
  - `delivery_zone` → `Delivery`
  - unknown entity → no emit
- Order service stock changes emit `Product, Home` (they already call `cache.invalidate('store:products')`).
- Cache is cleared before emit so a refetch cannot return stale data. Editing a draft changes no live data; the storefront refetch just returns the same content.
- Scheduled publish/unpublish is evaluated at read time (`isLive`) with no job. It becomes visible within the 60s cache TTL and does not emit. Accepted limitation.
- Single API instance only: the `Subject` is per process. Multiple instances would need Redis pub/sub behind the same service interface (not built now).

## 4. Storefront subscriber

- `useStoreEvents()` in `Layout`: one `EventSource(\`${API_URL}/store/events\`)`. On message, `dispatch(baseApi.util.invalidateTags(tags))`. RTK Query refetches only active subscriptions.
- On (re)connect, invalidate all tags to cover missed events. Close when the tab is hidden, reopen and resync when visible.
- CORS already allows the storefront origin via `cfg.corsOrigins`; add the storefront dev origin if missing.

## 5. Errors

Backend down at load: error state with retry; no stale hardcoded fallback. SSE failure: EventSource auto-reconnects; the app works without it (data just stops live-updating).

## 6. Testing

- Backend: unit test for the entity→tags map; e2e test that an admin publish yields an SSE event and the next `/store/home` shows new content.
- Storefront: `tsc --noEmit` and `vite build` pass. Manual check: edit and publish a hero block, a product price, a testimonial and a setting in the dashboard and confirm the open storefront tab updates.
