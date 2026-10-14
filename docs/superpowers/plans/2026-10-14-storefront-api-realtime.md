# Storefront on Jabali API with realtime content: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The storefront (`gift-shoe-app`) reads catalogue and home content from `jabali-be` through RTK Query, and open storefront tabs update within a second of a dashboard edit or publish.

**Architecture:** The storefront gets an RTK Query layer shaped like `jabali-dashboard` (`baseApi` + `injectEndpoints`, tags). The backend gains a public SSE stream (`GET /store/events`) fed by the audit interceptor (the one place every admin write already passes through, and which already clears the storefront cache). The storefront opens one `EventSource` and turns each event into `invalidateTags`, so RTK Query refetches only what is on screen.

**Tech Stack:** NestJS 11 + Prisma + RxJS (`@Sse`), React 19, Vite 8, TypeScript 7, `@reduxjs/toolkit` + `react-redux`, Node 24 built-in test runner (storefront), Jest (backend).

**Spec:** `gift-shoe-app/docs/superpowers/specs/2026-10-14-storefront-api-realtime-design.md`

**Repos (three separate git repos under `C:\Users\Administrator\Desktop\Projects`):** `jabali-be` (Tasks 1-2), `gift-shoe-app` (Tasks 3-8). `jabali-dashboard` is not changed.

## Deviations from the spec (found while planning; confirm at review)

1. **Block keys.** The backend seed already creates published blocks with keys `home.hero.<gender>`, `home.trust.<gender>`, `home.sections.<gender>`, `home.gift.<gender>`. The plan uses those, not the spec's `home.hero` style. No backend seed or schema change is needed. Seed data shapes: hero `{lines, sub, cta, image, alt, focalPoint, featuredProductSlug}`, trust `{items:[{icon,title,text}]}` (kind `banner`), sections `{categoriesTitle, topProductsTitle}`, gift `{productSlug, colour, wrap, ribbon, message, from, to}`. Category tiles come from the `categories` array in the `/store/home` bundle (no block).
2. **Cart lines snapshot the product.** Today the cart stores only a product id and looks the product up in the hardcoded list (`byId`). Deleting the hardcoded catalogue therefore needs each cart line to carry `snapshot: {slug, name, price, image}` taken when the item is added. This touches display code in the cart drawer, checkout summary, order confirmation and pricing, but not checkout logic. Consequence: a bag line keeps the price it was added at; re-quoting is the checkout follow-up. Old persisted bags (no snapshot) are dropped on load.
3. **`data/delivery.ts` stays** (checkout, which is out of scope, uses `zoneFor`/`allCounties` and the `"nairobi"` zone id). Only the home page delivery section reads zones from the API.
4. **Shop filtering stays client-side.** The API filters by a single category/colour/size and pages by cursor (max 60). The shop UI is multi-select, so `getProducts(gender)` follows the cursor to load the whole gender pool (about 35 products) and the existing filter code runs on it. Move to server filters if the catalogue grows past a few hundred items.
5. **Product cards lose the hover second image** (the list endpoint returns one image per product).
6. **Scheduled publish emits too.** `BlocksService.publishDue` runs on a 30s timer, so it can emit. Scheduled *un*publish is evaluated at read time and is still visible only after the 60s cache TTL (no emit).
7. **No settings endpoint in the storefront.** `/store/home` already carries `settings`, but nothing in the UI uses one yet. The free-delivery line on the home page uses the zone's `freeOver` instead.

## Global Constraints

- Realtime transport is SSE: `GET /api/v1/store/events`, public, event type `invalidate` with JSON `{"tags": [...]}`, heartbeat every 25s (event type `ping`).
- Tag vocabulary (storefront and backend): `Home, Product, Category, Content, Settings, Delivery, Testimonial`.
- Entity to tags: `content_block`, `page` -> `Home, Content`; `product`, `variant`, `colour`, `inventory`, `order` -> `Product, Home`; `media` -> `Product, Category, Home`; `category` -> `Category, Home`; `testimonial` -> `Testimonial, Home`; `setting` -> `Settings, Home`; `delivery_zone` -> `Delivery`; any other entity emits nothing.
- The backend clears the `store:` cache BEFORE it emits (a refetch must never see stale cache).
- Draft edits never change live data; only publish does.
- Storefront env var: `VITE_API_URL`, default `http://localhost:5000/api/v1`. The storefront calls `${VITE_API_URL}/store/...`.
- Scope is read-only content and catalogue. Cart quote, checkout, orders, M-Pesa, SSR are out of scope.
- Single API instance (in-process event bus).
- No new test framework in the storefront: tests use `node --test` (Node 24 strips types). Tested modules import only other tested modules with an explicit `.ts` extension and otherwise use `import type`.
- Commits: end every commit message with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. In `gift-shoe-app` the working tree already has many unrelated deleted `dist/` files: always `git add` explicit paths, never `git add -A`.

## Review Focus

Input classes the spec implies but a happy-path build would miss, each pinned by a test or manual step below:

1. **Backend unreachable, slow or returning an error** at page load: expect an error state with a retry button, never a blank page or a crash (Tasks 6, 7, 8 `ErrorState`; manual check in Task 8).
2. **Active product with no images or no variants** (an editor creates one): expect a placeholder, "sold out", no crash (Task 4 adapter tests, Task 5 `Photo`).
3. **Editor deletes or renames a category** so the category set no longer matches the curated home grid: expect a plain uniform grid, not a broken layout (Task 7 `gridLayout` test).
4. **Malformed block data or SSE payload** (blocks are free-form JSON): expect the section hidden or the event ignored (Task 4 `toHome` tests, Task 3 `parseInvalidate` tests).
5. **Realtime refetch while the visitor is mid-selection** (picked a size on a product page, then the editor changes the price) and **missed events** while disconnected: expect the selection preserved and a full resync on reconnect (Task 6 effect deps on `product?.id`; Task 3 reconnect resync; manual check in Task 8).

---

## Task 1: Backend SSE event bus and endpoint

Repo: `C:\Users\Administrator\Desktop\Projects\jabali-be`

**Files:**
- Create: `src/store-events/store-events.service.ts`
- Create: `src/store-events/store-events.controller.ts`
- Create: `src/store-events/store-events.module.ts`
- Test: `src/store-events/store-events.service.spec.ts`
- Modify: `src/app.module.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (Task 2 relies on these exact names):
  - `export interface StoreEvent { tags: string[]; at: number }`
  - `export function tagsForEntity(entity: string): string[]`
  - `StoreEventsService.events$: Observable<StoreEvent>`, `.emit(tags: string[]): void`, `.emitForEntity(entity: string): void`
  - `StoreEventsModule` is `@Global()`, exports `StoreEventsService`.
  - HTTP: `GET /api/v1/store/events` (SSE; `invalidate` events with data `{"tags":[...]}`, `ping` heartbeats).

- [ ] **Step 1: Write the failing test**

Create `src/store-events/store-events.service.spec.ts`:

```ts
import { firstValueFrom } from 'rxjs';
import { StoreEventsService, tagsForEntity } from './store-events.service';

describe('tagsForEntity', () => {
  it('maps admin entities to storefront tags', () => {
    expect(tagsForEntity('content_block')).toEqual(['Home', 'Content']);
    expect(tagsForEntity('product')).toEqual(['Product', 'Home']);
    expect(tagsForEntity('delivery_zone')).toEqual(['Delivery']);
  });

  it('returns nothing for entities the storefront does not show', () => {
    expect(tagsForEntity('promotion')).toEqual([]);
    expect(tagsForEntity('staff')).toEqual([]);
    expect(tagsForEntity('')).toEqual([]);
  });

  it('returns a copy so callers cannot mutate the table', () => {
    const tags = tagsForEntity('product');
    tags.push('Nope');
    expect(tagsForEntity('product')).toEqual(['Product', 'Home']);
  });
});

describe('StoreEventsService', () => {
  it('delivers emitted tags to subscribers', async () => {
    const svc = new StoreEventsService();
    const next = firstValueFrom(svc.events$);
    svc.emitForEntity('testimonial');
    const event = await next;
    expect(event.tags).toEqual(['Testimonial', 'Home']);
    expect(typeof event.at).toBe('number');
  });

  it('emits nothing for unknown entities or empty tag lists', () => {
    const svc = new StoreEventsService();
    const seen: unknown[] = [];
    svc.events$.subscribe((e) => seen.push(e));
    svc.emitForEntity('promotion');
    svc.emit([]);
    expect(seen).toEqual([]);
  });

  it('removes duplicate tags', async () => {
    const svc = new StoreEventsService();
    const next = firstValueFrom(svc.events$);
    svc.emit(['Home', 'Product', 'Home']);
    expect((await next).tags).toEqual(['Home', 'Product']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --selectProjects unit store-events`
Expected: FAIL with "Cannot find module './store-events.service'".

- [ ] **Step 3: Write the service**

Create `src/store-events/store-events.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface StoreEvent {
  tags: string[];
  at: number;
}

/** Storefront cache tags affected by an admin entity (the `entity` recorded by AuditInterceptor). */
const ENTITY_TAGS: Record<string, readonly string[]> = {
  content_block: ['Home', 'Content'],
  page: ['Home', 'Content'],
  product: ['Product', 'Home'],
  variant: ['Product', 'Home'],
  colour: ['Product', 'Home'],
  inventory: ['Product', 'Home'],
  order: ['Product', 'Home'],
  media: ['Product', 'Category', 'Home'],
  category: ['Category', 'Home'],
  testimonial: ['Testimonial', 'Home'],
  setting: ['Settings', 'Home'],
  delivery_zone: ['Delivery'],
};

/** Tags for an entity, or an empty list when the storefront does not show it. Always a fresh array. */
export function tagsForEntity(entity: string): string[] {
  return [...(ENTITY_TAGS[entity] ?? [])];
}

/** In-process bus: admin writes publish here, the SSE endpoint fans out to connected storefronts. */
@Injectable()
export class StoreEventsService {
  private readonly subject = new Subject<StoreEvent>();
  readonly events$: Observable<StoreEvent> = this.subject.asObservable();

  emit(tags: string[]): void {
    if (tags.length === 0) return;
    this.subject.next({ tags: [...new Set(tags)], at: Date.now() });
  }

  emitForEntity(entity: string): void {
    this.emit(tagsForEntity(entity));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --selectProjects unit store-events`
Expected: PASS (6 tests).

- [ ] **Step 5: Add the controller, module and register it**

Create `src/store-events/store-events.controller.ts`:

```ts
import { Controller, Header, MessageEvent, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { interval, map, merge, Observable } from 'rxjs';
import { StoreEventsService } from './store-events.service';

export const HEARTBEAT_MS = 25_000;

@ApiTags('store')
@Controller('store')
export class StoreEventsController {
  constructor(private readonly events: StoreEventsService) {}

  /**
   * Server-sent events. `invalidate` carries `{ tags }` for the storefront to refetch;
   * `ping` is a heartbeat so proxies keep the connection open.
   */
  @Sse('events')
  @Header('X-Accel-Buffering', 'no')
  stream(): Observable<MessageEvent> {
    const changes = this.events.events$.pipe(
      map((e): MessageEvent => ({ type: 'invalidate', id: String(e.at), data: { tags: e.tags } })),
    );
    const beat = interval(HEARTBEAT_MS).pipe(map((): MessageEvent => ({ type: 'ping', data: '' })));
    return merge(changes, beat);
  }
}
```

Create `src/store-events/store-events.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { StoreEventsController } from './store-events.controller';
import { StoreEventsService } from './store-events.service';

@Global()
@Module({
  controllers: [StoreEventsController],
  providers: [StoreEventsService],
  exports: [StoreEventsService],
})
export class StoreEventsModule {}
```

Modify `src/app.module.ts`: add `import { StoreEventsModule } from './store-events/store-events.module';` (after the `StaffModule` import) and add `StoreEventsModule,` to `imports` right after `CacheModule,`.

- [ ] **Step 6: Verify the build and the endpoint**

Run: `npm run build`
Expected: exits 0 with no TypeScript errors.

Run (needs the dev database; `npm run db:up` first if it is not running): `npm run start:dev`, then in another terminal `curl -N http://localhost:5000/api/v1/store/events`.
Expected: the connection stays open and prints no data until an event or the 25s `event: ping` frame; response header `Content-Type: text/event-stream`. Stop both with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add src/store-events src/app.module.ts
git commit -m "feat: SSE store event bus and /store/events endpoint

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 2: Backend emitters wired to admin writes, orders and scheduled publish

Repo: `C:\Users\Administrator\Desktop\Projects\jabali-be`

**Files:**
- Modify: `src/common/audit.interceptor.ts` (constructor, line ~76)
- Modify: `src/orders/orders.service.ts` (constructor line ~31, lines ~111 and ~347)
- Modify: `src/content/blocks.service.ts` (constructor line ~20, line ~203)
- Test: `test/store-events.e2e-spec.ts`

**Interfaces:**
- Consumes: `StoreEventsService.emit(tags)`, `.emitForEntity(entity)` from Task 1 (global module, no import in modules needed).
- Produces: after this task every successful admin write, order creation/transition and scheduled publish emits an `invalidate` event after the store cache is cleared.

- [ ] **Step 1: Write the failing e2e test**

Create `test/store-events.e2e-spec.ts` (needs the test Postgres: `npm run db:up`; `global-setup` creates/migrates/truncates `jabali_test` and seeds one owner):

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import { loadConfig } from '../src/config/config';
import { configureApp } from '../src/setup';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup';

const TEST_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://jabali:jabali_dev_pw@localhost:5439/jabali_test?schema=public';

/** Minimal SSE reader over fetch. */
async function openStream(url: string) {
  const ctrl = new AbortController();
  const res = await fetch(url, { signal: ctrl.signal });
  expect(res.headers.get('content-type')).toContain('text/event-stream');
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  return {
    async next(type: string, timeoutMs = 5000): Promise<{ tags: string[] }> {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          const event = /^event: (.*)$/m.exec(frame)?.[1];
          const data = /^data: (.*)$/m.exec(frame)?.[1];
          if (event === type && data) return JSON.parse(data) as { tags: string[] };
        }
        const left = deadline - Date.now();
        if (left <= 0) throw new Error(`no "${type}" event within ${timeoutMs}ms`);
        const chunk = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`no "${type}" event within ${timeoutMs}ms`)), left)),
        ]);
        if (chunk.done) throw new Error('stream ended');
        buffer += decoder.decode(chunk.value, { stream: true });
      }
    },
    close: () => ctrl.abort(),
  };
}

describe('GET /store/events', () => {
  let app: NestExpressApplication;
  let base: string;
  let auth: Record<string, string>;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_URL;
    process.env.ENABLE_SCHEDULER = 'false';
    const { AppModule } = await import('../src/app.module');
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api/v1`;
    const login = await fetch(`${base}/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
    });
    const { accessToken } = (await login.json()) as { accessToken: string };
    auth = { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' };
  });

  afterAll(async () => {
    await app.close();
  });

  it('emits Testimonial and Home tags after an admin testimonial write', async () => {
    const stream = await openStream(`${base}/store/events`);
    await fetch(`${base}/admin/testimonials`, { method: 'POST', headers: auth, body: JSON.stringify({ name: 'E2E', quote: 'Live update' }) });
    const event = await stream.next('invalidate');
    expect(event.tags).toEqual(expect.arrayContaining(['Testimonial', 'Home']));
    stream.close();
  });

  it('clears the store cache before emitting, so a refetch sees the published block', async () => {
    const key = `e2e.live.${Date.now()}`;
    const created = await fetch(`${base}/admin/content/blocks`, { method: 'POST', headers: auth, body: JSON.stringify({ key, kind: 'banner', data: { v: 1 } }) });
    const { id } = (await created.json()) as { id: string };
    await fetch(`${base}/admin/content/blocks/${id}/publish`, { method: 'POST', headers: auth, body: '{}' });

    // Prime the 60s cache with v1.
    const before = (await (await fetch(`${base}/store/home`)).json()) as { blocks: { key: string; data: { v: number } }[] };
    expect(before.blocks.find((b) => b.key === key)?.data.v).toBe(1);

    // Edit the draft first (this emits, but nothing is live yet), then open the stream and publish.
    await fetch(`${base}/admin/content/blocks/${id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ data: { v: 2 } }) });
    const stream = await openStream(`${base}/store/events`);
    await fetch(`${base}/admin/content/blocks/${id}/publish`, { method: 'POST', headers: auth, body: '{}' });
    const event = await stream.next('invalidate');
    expect(event.tags).toEqual(expect.arrayContaining(['Home', 'Content']));

    const after = (await (await fetch(`${base}/store/home`)).json()) as { blocks: { key: string; data: { v: number } }[] };
    expect(after.blocks.find((b) => b.key === key)?.data.v).toBe(2);
    stream.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- store-events`
Expected: FAIL with "no "invalidate" event within 5000ms" (nothing emits yet).

- [ ] **Step 3: Emit from the audit interceptor**

In `src/common/audit.interceptor.ts` add the import after the `CacheService` import:

```ts
import { StoreEventsService } from '../store-events/store-events.service';
```

Add a constructor parameter after `cache`:

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly events: StoreEventsService,
    private readonly reflector: Reflector,
  ) {}
```

Replace the line `        void this.cache.invalidate();` (inside `tap`) with:

```ts
        // Clear the cache first so the storefront's refetch cannot read stale data.
        void this.cache.invalidate().then(() => this.events.emitForEntity(entity));
```

- [ ] **Step 4: Emit from the orders service**

In `src/orders/orders.service.ts` add `import { StoreEventsService } from '../store-events/store-events.service';` with the other imports, add `private readonly events: StoreEventsService,` to the constructor after `private readonly cache: CacheService,`, and replace BOTH occurrences of `void this.cache.invalidate('store:products');` (about lines 111 and 347) with:

```ts
void this.cache.invalidate('store:products').then(() => this.events.emit(['Product', 'Home']));
```

- [ ] **Step 5: Emit from scheduled publish**

In `src/content/blocks.service.ts` add the same import, add `private readonly events: StoreEventsService,` to the constructor after `private readonly cache: CacheService,`, and replace `    if (n) void this.cache.invalidate();` (end of `publishDue`) with:

```ts
    if (n) void this.cache.invalidate().then(() => this.events.emit(['Home', 'Content']));
```

- [ ] **Step 6: Check nothing else constructs these classes by hand**

Run: `grep -rn "new BlocksService(\|new OrdersService(\|new AuditInterceptor(" src test`
Expected: no output. If anything matches, pass a `StoreEventsService` there too.

- [ ] **Step 7: Run all backend checks**

Run: `npm run build && npm test && npm run test:e2e -- store-events`
Expected: build exits 0, unit tests pass, both e2e tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/common/audit.interceptor.ts src/orders/orders.service.ts src/content/blocks.service.ts test/store-events.e2e-spec.ts
git commit -m "feat: emit storefront invalidation events on admin writes, orders and scheduled publish

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 3: Storefront RTK Query foundation and realtime subscriber

Repo: `C:\Users\Administrator\Desktop\Projects\gift-shoe-app`

This task is non-breaking: nothing consumes the new layer yet.

**Files:**
- Modify: `package.json`, `tsconfig.json`, `src/vite-env.d.ts`, `src/main.tsx`, `src/app/Layout.tsx`
- Create: `.env.example`, `src/api/tags.ts`, `src/api/baseApi.ts`, `src/api/events.ts`, `src/lib/media.ts`, `src/store/index.ts`, `src/store/hooks.ts`, `src/hooks/useStoreEvents.ts`
- Test: `src/lib/media.test.ts`, `src/api/events.test.ts`

**Interfaces:**
- Produces (later tasks rely on these exact names):
  - `src/api/tags.ts`: `TAGS` (readonly tuple), `type StoreTag`
  - `src/api/baseApi.ts`: `API_URL: string`, `baseApi`, `errorMessage(err: unknown): string`, `isNotFound(err: unknown): boolean`
  - `src/api/events.ts`: `parseInvalidate(raw: string): StoreTag[]`
  - `src/lib/media.ts`: `sized(url: string, w: number): string`, `srcSetFor(url: string, w: number): string | undefined`, `unsplash(id: string, w: number): string`, `NAIROBI_SKYLINE: string`
  - `src/store/index.ts`: `store`, `RootState`, `AppDispatch`; `src/store/hooks.ts`: `useAppDispatch`
  - `src/hooks/useStoreEvents.ts`: `useStoreEvents(): void`

- [ ] **Step 1: Install dependencies and enable tests**

Run: `npm install @reduxjs/toolkit react-redux`

In `package.json` add to `scripts`: `"test": "node --test \"src/**/*.test.ts\""`.

In `tsconfig.json` `compilerOptions` add `"allowImportingTsExtensions": true` (tests and the modules they import use explicit `.ts` extensions; `noEmit` is already on).

Create `.env.example`:

```
# Base URL of jabali-be (the storefront calls <VITE_API_URL>/store/...)
VITE_API_URL=http://localhost:5000/api/v1
```

Append to `src/vite-env.d.ts`:

```ts

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/lib/media.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { NAIROBI_SKYLINE, sized, srcSetFor, unsplash } from "./media.ts";

test("sized rewrites the width of Unsplash URLs", () => {
  assert.equal(sized("https://images.unsplash.com/photo-1?w=1600&q=75", 640), "https://images.unsplash.com/photo-1?w=640&q=75");
});

test("sized leaves other hosts untouched", () => {
  assert.equal(sized("http://localhost:5000/uploads/a.jpg", 640), "http://localhost:5000/uploads/a.jpg");
});

test("sized survives a malformed URL", () => {
  assert.equal(sized("not a url", 640), "not a url");
});

test("srcSetFor lists three widths for Unsplash", () => {
  const set = srcSetFor("https://images.unsplash.com/photo-1?w=900", 900);
  assert.match(set ?? "", /w=540 540w, .*w=900 900w, .*w=1800 1800w/);
});

test("srcSetFor is undefined for images that cannot be resized", () => {
  assert.equal(srcSetFor("http://localhost:5000/uploads/a.jpg", 900), undefined);
});

test("unsplash builds a photo URL", () => {
  assert.equal(unsplash("abc", 1600), "https://images.unsplash.com/photo-abc?w=1600&q=75&auto=format&fit=crop");
  assert.match(unsplash(NAIROBI_SKYLINE, 800), /^https:\/\/images\.unsplash\.com\/photo-/);
});
```

Create `src/api/events.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInvalidate } from "./events.ts";

test("returns the known tags", () => {
  assert.deepEqual(parseInvalidate('{"tags":["Home","Product"]}'), ["Home", "Product"]);
});

test("drops unknown or non-string tags", () => {
  assert.deepEqual(parseInvalidate('{"tags":["Home","Nope",3,null]}'), ["Home"]);
});

test("malformed payloads yield no tags", () => {
  for (const raw of ["", "not json", "null", "{}", "[]", '{"tags":"Home"}', '{"tags":{"a":1}}']) {
    assert.deepEqual(parseInvalidate(raw), [], raw);
  }
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL (`Cannot find module './media.ts'` / `'./events.ts'`).

- [ ] **Step 4: Implement `tags`, `events` and `media`**

Create `src/api/tags.ts`:

```ts
/** RTK Query tag types. The backend's SSE `invalidate` events use exactly these names. */
export const TAGS = ["Home", "Product", "Category", "Content", "Settings", "Delivery", "Testimonial"] as const;
export type StoreTag = (typeof TAGS)[number];
```

Create `src/api/events.ts`:

```ts
import { TAGS, type StoreTag } from "./tags.ts";

/** Tags from an SSE `invalidate` payload. Anything malformed or unknown is ignored. */
export function parseInvalidate(raw: string): StoreTag[] {
  try {
    const data = JSON.parse(raw) as { tags?: unknown };
    if (!Array.isArray(data.tags)) return [];
    return data.tags.filter((t): t is StoreTag => typeof t === "string" && (TAGS as readonly string[]).includes(t));
  } catch {
    return [];
  }
}
```

Create `src/lib/media.ts`:

```ts
/** The delivery section's decorative backdrop (static, not editable in the CMS). */
export const NAIROBI_SKYLINE = "1596005554384-d293674c91d7";

export const unsplash = (id: string, w: number): string => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

const isResizable = (url: string): boolean => {
  try {
    return new URL(url).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
};

/** Request width `w` from Unsplash. Other hosts (our own uploads, other CDNs) are returned unchanged. */
export function sized(url: string, w: number): string {
  if (!isResizable(url)) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(w));
  return u.toString();
}

/** A three-width `srcSet`, or undefined when the image cannot be resized. */
export function srcSetFor(url: string, w: number): string | undefined {
  if (!isResizable(url)) return undefined;
  const small = Math.round(w * 0.6);
  return `${sized(url, small)} ${small}w, ${sized(url, w)} ${w}w, ${sized(url, w * 2)} ${w * 2}w`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (media 6, events 3).

- [ ] **Step 6: Add `baseApi`, the store and the Provider**

Create `src/api/baseApi.ts`:

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TAGS } from "./tags";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api/v1";

/** Public storefront API (no auth). Content endpoints are injected per domain, like the dashboard. */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/store` }),
  tagTypes: TAGS,
  endpoints: () => ({}),
});

/** Human-readable message from the backend's problem+json errors. */
export function errorMessage(err: unknown): string {
  const e = err as { data?: { detail?: string; title?: string }; error?: string };
  return e?.data?.detail ?? e?.data?.title ?? e?.error ?? "Something went wrong";
}

export const isNotFound = (err: unknown): boolean => (err as { status?: unknown } | undefined)?.status === 404;
```

Create `src/store/index.ts`:

```ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/api/baseApi";

export const store = configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer },
  middleware: (gdm) => gdm().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

Create `src/store/hooks.ts`:

```ts
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
```

Modify `src/main.tsx`: add `import { Provider } from "react-redux";` and `import { store } from "@/store";`, and wrap the tree:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
```

- [ ] **Step 7: Add the realtime hook and mount it**

Create `src/hooks/useStoreEvents.ts`:

```ts
import { useEffect } from "react";
import { API_URL, baseApi } from "@/api/baseApi";
import { parseInvalidate } from "@/api/events";
import { TAGS } from "@/api/tags";
import { useAppDispatch } from "@/store/hooks";

const EVENTS_URL = `${API_URL}/store/events`;

/**
 * Keeps the storefront live: one EventSource, each `invalidate` event refetches the affected queries.
 * A re-opened stream (auto-reconnect, or the tab becoming visible again) invalidates everything,
 * because events may have been missed in between. The stream is closed while the tab is hidden.
 */
export function useStoreEvents(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    let opened = false;

    const open = () => {
      if (source) return;
      const es = new EventSource(EVENTS_URL);
      es.addEventListener("open", () => {
        if (opened) dispatch(baseApi.util.invalidateTags([...TAGS]));
        opened = true;
      });
      es.addEventListener("invalidate", (e) => {
        const tags = parseInvalidate((e as MessageEvent<string>).data);
        if (tags.length) dispatch(baseApi.util.invalidateTags(tags));
      });
      source = es;
    };
    const close = () => {
      source?.close();
      source = null;
    };
    const onVisibility = () => (document.hidden ? close() : open());

    open();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      close();
    };
  }, [dispatch]);
}
```

Modify `src/app/Layout.tsx`: add `import { useStoreEvents } from "@/hooks/useStoreEvents";` and call `useStoreEvents();` as the first line of the `Layout` function body.

- [ ] **Step 8: Verify**

Run: `npm run build`
Expected: `tsc --noEmit` and `vite build` exit 0 (nothing else changed yet, so the app still compiles).

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json .env.example src/vite-env.d.ts src/main.tsx src/app/Layout.tsx src/api/tags.ts src/api/baseApi.ts src/api/events.ts src/api/events.test.ts src/lib/media.ts src/lib/media.test.ts src/store/index.ts src/store/hooks.ts src/hooks/useStoreEvents.ts
git commit -m "feat: RTK Query foundation and SSE subscriber for the storefront

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 4: Storefront models, API types, adapters and endpoints

Repo: `gift-shoe-app`. **Tasks 4 to 8 form one compile unit:** this task replaces the `Product` model, which breaks the old hardcoded data files and their consumers until Task 8 deletes or migrates them. Do not run `npm run build` until Task 8. After this task, verify with `npm test` and with a scoped type check: `npx tsc --noEmit 2>&1 | grep -E "src/(api|models)/"` must print nothing.

**Files:**
- Rewrite: `src/models/product.ts`, `src/models/delivery.ts` (append only)
- Modify: `src/models/cart.ts`, `src/models/index.ts`
- Create: `src/models/home.ts`, `src/api/types.ts`, `src/api/adapters.ts`, `src/api/catalogue.ts`, `src/api/home.ts`, `src/api/delivery.ts`
- Test: `src/api/adapters.test.ts`

**Interfaces:**
- Consumes: `baseApi`, `StoreTag` from Task 3.
- Produces (UI models, used by Tasks 5-8):

```ts
// src/models/product.ts
export type Gender = "men" | "women";
export interface Swatch { name: string; hex: string }
export interface Product { id: string; slug: string; name: string; gender: Gender; category: string; categoryLabel: string;
  price: number; compareAt?: number; colors: Swatch[]; sizes: string[]; image: string | null;
  bestseller?: boolean; isNew?: boolean; rating: number; sold: number; inStock: boolean }
export interface ProductVariant { colourName: string | null; size: string; available: number; inStock: boolean }
export interface ProductDetail extends Product { blurb: string; images: string[]; colorImages: Record<string, string[]>; variants: ProductVariant[] }
export interface CategoryDef { slug: string; label: string; tag: string; image: string | null; count: number }
export interface Testimonial { id: string; name: string; location: string; quote: string }
// src/models/delivery.ts (added)
export interface DeliveryZoneInfo { id: string; label: string; fee: number; eta: string; freeOver: number | null }
// src/models/home.ts
export interface HeroBlock { lines: [string, string]; sub: string; cta: string; image: string; alt: string; focalPoint: string; featuredProductSlug: string }
export interface TrustItem { icon: string; title: string; text: string }
export interface SectionsBlock { categoriesTitle: string; topProductsTitle: string }
export interface GiftBlock { productSlug: string; colour: string; wrap: string; ribbon: string; message: string; from: string; to: string }
export interface HomeData { hero: HeroBlock | null; trust: TrustItem[]; sections: SectionsBlock | null; gift: GiftBlock | null;
  testimonials: Testimonial[]; categories: CategoryDef[]; topProducts: Product[] }
```

  - Hooks: `useGetProductsQuery(gender: Gender)` -> `Product[]`; `useGetProductQuery(slug: string)` -> `ProductDetail`; `useGetCategoriesQuery(gender: Gender)` -> `CategoryDef[]`; `useGetHomeQuery(gender: Gender)` -> `HomeData`; `useGetZonesQuery()` -> `DeliveryZoneInfo[]`.
  - Adapters: `toProduct`, `toProductDetail`, `toCategory`, `toTestimonial`, `toZoneInfo`, `toHome(api: ApiHome, gender: Gender): HomeData`.

- [ ] **Step 1: Replace the models**

Replace the whole of `src/models/product.ts`:

```ts
/** Which side of the store a product or category belongs to. Also drives the visual theme. */
export type Gender = "men" | "women";

export interface Swatch {
  name: string;
  hex: string;
}

/** A product as shown in lists and cards. Comes from the API (`/store/products`). */
export interface Product {
  id: string;
  /** URL key: `/product/:slug`. */
  slug: string;
  name: string;
  gender: Gender;
  /** Category slug. */
  category: string;
  categoryLabel: string;
  /** Price in Kenya Shillings. */
  price: number;
  /** Original price when the item is discounted. */
  compareAt?: number;
  colors: Swatch[];
  sizes: string[];
  /** Main photo URL; null until an editor adds one. */
  image: string | null;
  bestseller?: boolean;
  isNew?: boolean;
  rating: number;
  sold: number;
  inStock: boolean;
}

export interface ProductVariant {
  /** Colour name, or null when the variant is not tied to a colour. */
  colourName: string | null;
  size: string;
  available: number;
  inStock: boolean;
}

/** A product page: the card fields plus galleries and stock. */
export interface ProductDetail extends Product {
  blurb: string;
  /** Shared gallery (photo URLs). */
  images: string[];
  /** Gallery per colour name; a colour without its own photos shows the shared gallery. */
  colorImages: Record<string, string[]>;
  variants: ProductVariant[];
}

export interface CategoryDef {
  slug: string;
  label: string;
  tag: string;
  image: string | null;
  /** Number of active products. */
  count: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
}
```

Append to `src/models/delivery.ts`:

```ts

/** A delivery zone as shown on the home page (from the API). Checkout still uses `Zone`. */
export interface DeliveryZoneInfo {
  id: string;
  label: string;
  fee: number;
  eta: string;
  /** Order value above which delivery is free, if the zone has one. */
  freeOver: number | null;
}
```

Create `src/models/home.ts`:

```ts
import type { CategoryDef, Product, Testimonial } from "./product";

/** Hero block data (`home.hero.<gender>`). */
export interface HeroBlock {
  /** Two headline lines. The second is highlighted. */
  lines: [string, string];
  sub: string;
  cta: string;
  /** Photo URL. */
  image: string;
  alt: string;
  /** CSS object-position for the photo. */
  focalPoint: string;
  /** Product slug shown in the "Pictured" tag. Empty hides the tag. */
  featuredProductSlug: string;
}

export interface TrustItem {
  /** Icon name: phone, package, ruler or hand-coins. Unknown names show a package. */
  icon: string;
  title: string;
  text: string;
}

export interface SectionsBlock {
  categoriesTitle: string;
  topProductsTitle: string;
}

/** The sample gift played in the home teaser. */
export interface GiftBlock {
  productSlug: string;
  colour: string;
  wrap: string;
  ribbon: string;
  message: string;
  from: string;
  to: string;
}

/** Everything the home page renders, already adapted from `/store/home`. */
export interface HomeData {
  hero: HeroBlock | null;
  trust: TrustItem[];
  sections: SectionsBlock | null;
  gift: GiftBlock | null;
  testimonials: Testimonial[];
  categories: CategoryDef[];
  topProducts: Product[];
}
```

Modify `src/models/index.ts`: add the line `export type * from "./home";`.

Modify `src/models/cart.ts`: replace the `CartLine` and `NewCartLine` definitions with:

```ts
/** What the bag shows for a line, captured when the item is added. */
export interface ProductSnapshot {
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

export interface CartLine {
  /** Stable identity: product + size + colour + gift message. */
  key: string;
  productId: string;
  size: string;
  color: string;
  qty: number;
  snapshot: ProductSnapshot;
  gift?: GiftInfo;
}

/** What callers pass to `add`. The key is derived and quantity defaults to 1. */
export type NewCartLine = Omit<CartLine, "key" | "qty"> & { qty?: number };
```

- [ ] **Step 2: Write the API wire types**

Create `src/api/types.ts`:

```ts
import type { Gender } from "@/models";

/** Wire shapes returned by jabali-be `/store/*`. Adapters turn these into the UI models. */

export interface ApiColour {
  id: string;
  name: string;
  hex: string;
}

export interface ApiProductCard {
  id: string;
  slug: string;
  name: string;
  gender: Gender;
  category: { id: string; slug: string; label: string };
  price: number;
  compareAt: number | null;
  colours: ApiColour[];
  sizes: string[];
  image: string | null;
  isNew: boolean;
  isBestseller: boolean;
  rating: number;
  sold: number;
  inStock: boolean;
}

export interface ApiImage {
  id: string;
  url: string;
  alt: string;
}

export interface ApiVariant {
  id: string;
  sku: string;
  colourId: string | null;
  size: string;
  price: number;
  available: number;
  inStock: boolean;
  lowStock: boolean;
}

export interface ApiProductDetail extends ApiProductCard {
  blurb: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ApiImage[];
  colours: (ApiColour & { images: ApiImage[] })[];
  variants: ApiVariant[];
}

export interface ApiCategory {
  id: string;
  gender: Gender;
  slug: string;
  label: string;
  tagline: string | null;
  image: string | null;
  productCount: number;
}

export interface ApiTestimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  isLead: boolean;
  avatar: string | null;
}

export interface ApiBlock {
  key: string;
  kind: string;
  gender: Gender | null;
  version: number;
  data: unknown;
}

export interface ApiZone {
  id: string;
  code: string;
  name: string;
  counties: string[];
  fee: number;
  etaDays: number;
  eta: string;
  freeOver: number | null;
  sortOrder: number;
  active: boolean;
}

export interface ApiHome {
  gender: Gender | null;
  blocks: ApiBlock[];
  testimonials: ApiTestimonial[];
  categories: ApiCategory[];
  topProducts: ApiProductCard[];
  settings: Record<string, unknown>;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
```

- [ ] **Step 3: Write the failing adapter tests**

Create `src/api/adapters.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { toCategory, toHome, toProduct, toProductDetail, toTestimonial, toZoneInfo } from "./adapters.ts";

const card = {
  id: "p1", slug: "oxford", name: "Oxford", gender: "men" as const,
  category: { id: "c1", slug: "shirts", label: "Shirts" },
  price: 3200, compareAt: null, colours: [{ id: "k1", name: "White", hex: "#fff" }],
  sizes: ["S", "M"], image: "https://x/a.jpg", isNew: true, isBestseller: false, rating: 4.5, sold: 10, inStock: true,
};

test("toProduct maps names and turns null compareAt into undefined", () => {
  const p = toProduct(card);
  assert.equal(p.category, "shirts");
  assert.equal(p.categoryLabel, "Shirts");
  assert.equal(p.compareAt, undefined);
  assert.deepEqual(p.colors, [{ name: "White", hex: "#fff" }]);
  assert.equal(p.bestseller, false);
  assert.equal(p.isNew, true);
});

test("toProduct keeps a missing image as null", () => {
  assert.equal(toProduct({ ...card, image: null }).image, null);
});

test("toProductDetail builds per-colour galleries and variants", () => {
  const d = toProductDetail({
    ...card, blurb: null, seoTitle: null, seoDescription: null,
    images: [{ id: "i1", url: "https://x/shared.jpg", alt: "" }],
    colours: [{ id: "k1", name: "White", hex: "#fff", images: [{ id: "i2", url: "https://x/white.jpg", alt: "" }] }],
    variants: [
      { id: "v1", sku: "A", colourId: "k1", size: "S", price: 3200, available: 3, inStock: true, lowStock: false },
      { id: "v2", sku: "B", colourId: null, size: "M", price: 3200, available: 0, inStock: false, lowStock: false },
    ],
  });
  assert.equal(d.blurb, "");
  assert.deepEqual(d.images, ["https://x/shared.jpg"]);
  assert.deepEqual(d.colorImages, { White: ["https://x/white.jpg"] });
  assert.deepEqual(d.variants, [
    { colourName: "White", size: "S", available: 3, inStock: true },
    { colourName: null, size: "M", available: 0, inStock: false },
  ]);
});

test("toProductDetail copes with a product that has no images or variants", () => {
  const d = toProductDetail({ ...card, image: null, sizes: [], colours: [], blurb: "b", seoTitle: null, seoDescription: null, images: [], variants: [] });
  assert.deepEqual(d.images, []);
  assert.deepEqual(d.colorImages, {});
  assert.deepEqual(d.variants, []);
});

test("toCategory, toTestimonial and toZoneInfo rename fields", () => {
  assert.deepEqual(toCategory({ id: "c", gender: "men", slug: "suits", label: "Suits", tagline: null, image: null, productCount: 4 }), { slug: "suits", label: "Suits", tag: "", image: null, count: 4 });
  assert.deepEqual(toTestimonial({ id: "t", name: "A", location: "B", quote: "C", rating: 5, isLead: true, avatar: null }), { id: "t", name: "A", location: "B", quote: "C" });
  assert.deepEqual(toZoneInfo({ id: "z", code: "nairobi", name: "Nairobi", counties: [], fee: 250, etaDays: 1, eta: "Same day", freeOver: 10000, sortOrder: 0, active: true }), { id: "z", label: "Nairobi", fee: 250, eta: "Same day", freeOver: 10000 });
});

const home = (blocks: { key: string; data: unknown }[]) =>
  toHome({ gender: "men", blocks: blocks.map((b) => ({ ...b, kind: "x", gender: "men" as const, version: 1 })), testimonials: [], categories: [], topProducts: [], settings: {} }, "men");

test("toHome picks the blocks for the requested gender by key", () => {
  const h = home([
    { key: "home.hero.men", data: { lines: ["A", "B"], sub: "s", cta: "c", image: "i", alt: "a", focalPoint: "1% 2%", featuredProductSlug: "oxford" } },
    { key: "home.hero.women", data: { lines: ["X", "Y"] } },
    { key: "home.trust.men", data: { items: [{ icon: "phone", title: "T", text: "x" }] } },
    { key: "home.sections.men", data: { categoriesTitle: "C", topProductsTitle: "T" } },
    { key: "home.gift.men", data: { productSlug: "oxford", colour: "White", wrap: "forest", ribbon: "gold", message: "m", from: "f", to: "t" } },
  ]);
  assert.deepEqual(h.hero?.lines, ["A", "B"]);
  assert.equal(h.trust[0].title, "T");
  assert.equal(h.sections?.categoriesTitle, "C");
  assert.equal(h.gift?.productSlug, "oxford");
});

test("toHome hides sections whose block is missing or malformed", () => {
  const h = home([
    { key: "home.hero.men", data: { lines: "not an array" } },
    { key: "home.trust.men", data: { items: "nope" } },
    { key: "home.gift.men", data: { colour: "White" } },
    { key: "home.sections.men", data: null },
  ]);
  assert.equal(h.hero, null);
  assert.deepEqual(h.trust, []);
  assert.equal(h.gift, null);
  assert.equal(h.sections, null);
  assert.equal(home([]).hero, null);
});

test("toHome drops trust items without a title and fills missing hero fields", () => {
  const h = home([
    { key: "home.trust.men", data: { items: [{ icon: "phone" }, { icon: "ruler", title: "Ok", text: "y" }, 7] } },
    { key: "home.hero.men", data: { lines: ["A", "B"] } },
  ]);
  assert.deepEqual(h.trust, [{ icon: "ruler", title: "Ok", text: "y" }]);
  assert.equal(h.hero?.cta, "Shop now");
  assert.equal(h.hero?.featuredProductSlug, "");
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL (`Cannot find module './adapters.ts'`).

- [ ] **Step 5: Implement the adapters**

Create `src/api/adapters.ts`:

```ts
import type { CategoryDef, DeliveryZoneInfo, GiftBlock, Gender, HeroBlock, HomeData, Product, ProductDetail, SectionsBlock, Testimonial, TrustItem } from "@/models";
import type { ApiCategory, ApiHome, ApiProductCard, ApiProductDetail, ApiTestimonial, ApiZone } from "./types";

export const toProduct = (c: ApiProductCard): Product => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  gender: c.gender,
  category: c.category.slug,
  categoryLabel: c.category.label,
  price: c.price,
  compareAt: c.compareAt ?? undefined,
  colors: c.colours.map(({ name, hex }) => ({ name, hex })),
  sizes: c.sizes,
  image: c.image,
  bestseller: c.isBestseller,
  isNew: c.isNew,
  rating: c.rating,
  sold: c.sold,
  inStock: c.inStock,
});

export const toProductDetail = (d: ApiProductDetail): ProductDetail => {
  const colourName = new Map(d.colours.map((c) => [c.id, c.name]));
  return {
    ...toProduct(d),
    blurb: d.blurb ?? "",
    images: d.images.map((i) => i.url),
    colorImages: Object.fromEntries(d.colours.map((c) => [c.name, c.images.map((i) => i.url)])),
    variants: d.variants.map((v) => ({
      colourName: v.colourId ? (colourName.get(v.colourId) ?? null) : null,
      size: v.size,
      available: v.available,
      inStock: v.inStock,
    })),
  };
};

export const toCategory = (c: ApiCategory): CategoryDef => ({ slug: c.slug, label: c.label, tag: c.tagline ?? "", image: c.image, count: c.productCount });

export const toTestimonial = (t: ApiTestimonial): Testimonial => ({ id: t.id, name: t.name, location: t.location, quote: t.quote });

export const toZoneInfo = (z: ApiZone): DeliveryZoneInfo => ({ id: z.id, label: z.name, fee: z.fee, eta: z.eta, freeOver: z.freeOver });

// ---- home blocks are free-form JSON edited in the dashboard: validate before trusting them.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

function asHero(v: unknown): HeroBlock | null {
  if (!isObj(v) || !Array.isArray(v.lines) || v.lines.length < 2) return null;
  return {
    lines: [str(v.lines[0]), str(v.lines[1])],
    sub: str(v.sub),
    cta: str(v.cta, "Shop now"),
    image: str(v.image),
    alt: str(v.alt),
    focalPoint: str(v.focalPoint, "50% 50%"),
    featuredProductSlug: str(v.featuredProductSlug),
  };
}

function asTrust(v: unknown): TrustItem[] {
  if (!isObj(v) || !Array.isArray(v.items)) return [];
  return v.items
    .filter(isObj)
    .map((i) => ({ icon: str(i.icon), title: str(i.title), text: str(i.text) }))
    .filter((i) => i.title !== "");
}

function asSections(v: unknown): SectionsBlock | null {
  if (!isObj(v)) return null;
  return { categoriesTitle: str(v.categoriesTitle), topProductsTitle: str(v.topProductsTitle) };
}

function asGift(v: unknown): GiftBlock | null {
  if (!isObj(v) || str(v.productSlug) === "") return null;
  return {
    productSlug: str(v.productSlug),
    colour: str(v.colour),
    wrap: str(v.wrap),
    ribbon: str(v.ribbon),
    message: str(v.message),
    from: str(v.from),
    to: str(v.to),
  };
}

/** Turns the `/store/home` bundle into what the home page renders. Block keys are `home.<part>.<gender>`. */
export function toHome(api: ApiHome, gender: Gender): HomeData {
  const block = (part: string): unknown => api.blocks.find((b) => b.key === `home.${part}.${gender}`)?.data;
  return {
    hero: asHero(block("hero")),
    trust: asTrust(block("trust")),
    sections: asSections(block("sections")),
    gift: asGift(block("gift")),
    testimonials: api.testimonials.map(toTestimonial),
    categories: api.categories.map(toCategory),
    topProducts: api.topProducts.map(toProduct),
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all adapter tests plus the earlier ones).

- [ ] **Step 7: Add the endpoints**

Create `src/api/catalogue.ts`:

```ts
import type { CategoryDef, Gender, Product, ProductDetail } from "@/models";
import { baseApi } from "./baseApi";
import { toCategory, toProduct, toProductDetail } from "./adapters";
import type { ApiCategory, ApiProductCard, ApiProductDetail, CursorPage } from "./types";

/** The API caps a page at 60 products. */
const PAGE = 60;

export const catalogueApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Every active product for one side of the store, following the cursor to the end. */
    getProducts: b.query<Product[], Gender>({
      async queryFn(gender, _api, _extra, baseQuery) {
        const items: ApiProductCard[] = [];
        let cursor: string | null = null;
        do {
          const res = await baseQuery({ url: "/products", params: { gender, limit: PAGE, ...(cursor ? { cursor } : {}) } });
          if (res.error) return { error: res.error };
          const page = res.data as CursorPage<ApiProductCard>;
          items.push(...page.items);
          cursor = page.nextCursor;
        } while (cursor);
        return { data: items.map(toProduct) };
      },
      providesTags: ["Product"],
    }),
    getProduct: b.query<ProductDetail, string>({
      query: (slug) => `/products/${encodeURIComponent(slug)}`,
      transformResponse: (r: ApiProductDetail) => toProductDetail(r),
      providesTags: ["Product"],
    }),
    getCategories: b.query<CategoryDef[], Gender>({
      query: (gender) => ({ url: "/categories", params: { gender } }),
      transformResponse: (r: ApiCategory[]) => r.map(toCategory),
      providesTags: ["Category"],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductQuery, useGetCategoriesQuery } = catalogueApi;
```

Create `src/api/home.ts`:

```ts
import type { Gender, HomeData } from "@/models";
import { baseApi } from "./baseApi";
import { toHome } from "./adapters";
import type { ApiHome } from "./types";

export const homeApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Hero, trust strip, titles, gift teaser, testimonials, categories and top sellers in one call. */
    getHome: b.query<HomeData, Gender>({
      query: (gender) => ({ url: "/home", params: { gender } }),
      transformResponse: (r: ApiHome, _meta, gender) => toHome(r, gender),
      providesTags: ["Home"],
    }),
  }),
});

export const { useGetHomeQuery } = homeApi;
```

Create `src/api/delivery.ts`:

```ts
import type { DeliveryZoneInfo } from "@/models";
import { baseApi } from "./baseApi";
import { toZoneInfo } from "./adapters";
import type { ApiZone } from "./types";

export const deliveryApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getZones: b.query<DeliveryZoneInfo[], void>({
      query: () => "/delivery/zones",
      transformResponse: (r: ApiZone[]) => r.map(toZoneInfo),
      providesTags: ["Delivery"],
    }),
  }),
});

export const { useGetZonesQuery } = deliveryApi;
```

- [ ] **Step 8: Verify**

Run: `npm test`
Expected: PASS.

Run: `npx tsc --noEmit 2>&1 | grep -E "src/(api|models)/"`
Expected: no output (errors elsewhere are expected until Task 8).

- [ ] **Step 9: Commit**

```bash
git add src/models src/api/types.ts src/api/adapters.ts src/api/adapters.test.ts src/api/catalogue.ts src/api/home.ts src/api/delivery.ts
git commit -m "feat: API-backed product/home models, adapters and RTK Query endpoints

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 5: Photo component, cart snapshots, routes and order display

Repo: `gift-shoe-app` (part of the Task 4-8 compile unit).

**Files:**
- Rewrite: `src/components/ui/Photo.tsx`
- Modify: `src/models/ui.ts`, `src/config/routes.ts`, `src/store/cart.ts`, `src/services/pricing.ts`, `src/components/layout/CartLineItem.tsx`, `src/features/checkout/components/OrderSummary.tsx`, `src/features/order/OrderConfirmationPage.tsx`
- Create: `src/lib/snapshot.ts`, `src/components/ui/ErrorState.tsx`

**Interfaces:**
- Consumes: `ProductSnapshot`, `Product`, `ProductDetail` (Task 4); `sized`, `srcSetFor` (Task 3).
- Produces:
  - `<Photo src={string | null | undefined} alt w? className? eager? position? />` (the `id` prop is gone).
  - `snapshotOf(p: Product, image?: string | null): ProductSnapshot` in `src/lib/snapshot.ts`.
  - `productPath(slug: string): string`; `ROUTES.product === "/product/:slug"`.
  - `<ErrorState title text? onRetry? />` in `src/components/ui/ErrorState.tsx`.
  - `useCart().add` now requires `snapshot` in the line.

- [ ] **Step 1: Rewrite `Photo`**

Replace `src/components/ui/Photo.tsx`:

```tsx
import { useState } from "react";
import type { PhotoProps } from "@/models";
import { sized, srcSetFor } from "@/lib/media";

/** Photo URL with a neutral placeholder and a fade-in once loaded. A missing or broken URL shows the placeholder. */
export function Photo({ src, alt, w = 900, className = "", eager, position }: PhotoProps) {
  return (
    <span className={`block overflow-hidden bg-surface-2 ${className}`}>
      {/* Keyed by URL so a replaced photo (live edit) fades in fresh instead of reusing the old load state. */}
      {src ? <PhotoImage key={src} src={src} alt={alt} w={w} eager={eager} position={position} /> : null}
    </span>
  );
}

function PhotoImage({ src, alt, w, eager, position }: { src: string; alt: string; w: number; eager?: boolean; position?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={sized(src, w)}
      srcSet={srcSetFor(src, w)}
      sizes="(min-width: 1024px) 40vw, 90vw"
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      style={position ? { objectPosition: position } : undefined}
      className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}
```

In `src/models/ui.ts` replace the `PhotoProps` interface with:

```ts
export interface PhotoProps {
  /** Photo URL. Missing or broken URLs show a neutral placeholder. */
  src: string | null | undefined;
  alt: string;
  /** Requested width in px. Smaller and larger variants are generated for srcSet when the host supports it. */
  w?: number;
  className?: string;
  /** Load immediately instead of lazily (use for the hero image). */
  eager?: boolean;
  /** CSS object-position, e.g. "50% 20%". */
  position?: string;
}
```

Also in `src/models/ui.ts` change `ProductCardProps` unchanged (still `{ product: Product; index?: number }`) and remove the now-unused `import type { Product } from "./product";` only if the compiler reports it unused (it is still used by `ProductCardProps`, so leave it).

- [ ] **Step 2: Snapshot helper and shared error state**

Create `src/lib/snapshot.ts`:

```ts
import type { Product, ProductSnapshot } from "@/models";

/** What a bag line remembers about its product. `image` overrides the main photo (e.g. the chosen colour). */
export const snapshotOf = (p: Product, image?: string | null): ProductSnapshot => ({
  slug: p.slug,
  name: p.name,
  price: p.price,
  image: image ?? p.image,
});
```

Create `src/components/ui/ErrorState.tsx`:

```tsx
interface ErrorStateProps {
  title: string;
  text?: string;
  onRetry?: () => void;
}

/** Shown when the API cannot be reached or returns an error. */
export function ErrorState({ title, text = "Check your connection and try again.", onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="mx-auto max-w-xl px-4 py-32 text-center">
      <h1 className="display text-5xl">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      {onRetry && (
        <button className="btn-dark mt-8" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Routes use the slug**

In `src/config/routes.ts` change `product: "/product/:id",` to `product: "/product/:slug",` and replace the helper:

```ts
export const productPath = (slug: string): string => `/product/${slug}`;
```

- [ ] **Step 4: Cart store and pricing use the snapshot**

In `src/store/cart.ts` remove the line `import { byId } from "@/data/products";` and replace the `merge` function:

```ts
      // Bags saved before products came from the API have no snapshot and cannot be shown: drop them.
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<CartState>;
        const lastOrder = p.lastOrder?.lines.every((l) => l.snapshot) ? p.lastOrder : null;
        return { ...current, ...p, lastOrder, lines: (p.lines ?? []).filter((l) => l.snapshot?.slug) };
      },
```

In `src/services/pricing.ts` remove `import { byId } from "@/data/products";` and replace `unitPrice`:

```ts
/** Price of one unit of a cart line (as captured when it was added), including the gift-wrap fee for gifts. */
export const unitPrice = (line: CartLine): number => line.snapshot.price + (line.gift ? GIFT_FEE : 0);
```

- [ ] **Step 5: Display code reads the snapshot**

`src/components/layout/CartLineItem.tsx`: remove `import { byId } from "@/data/products";`; replace
```tsx
  const p = byId(line.productId);
  if (!p) return null;
```
with `const p = line.snapshot;`; change `<Link to={productPath(p.id)} ...>` to `<Link to={productPath(p.slug)} ...>` and `<Photo id={p.images[0]} alt={p.name} w={240} className="h-full w-full" />` to `<Photo src={p.image} alt={p.name} w={240} className="h-full w-full" />`.

`src/features/checkout/components/OrderSummary.tsx`: remove `import { byId } from "@/data/products";`; replace
```tsx
          const p = byId(l.productId);
          if (!p) return null;
```
with `const p = l.snapshot;`; change `<Photo id={p.images[0]} alt={p.name} w={160} className="h-full w-full" />` to `<Photo src={p.image} alt={p.name} w={160} className="h-full w-full" />`.

`src/features/order/OrderConfirmationPage.tsx`: remove `import { byId } from "@/data/products";`; replace `const p = byId(l.productId);` with `const p = l.snapshot;` and `{p?.name}` with `{p.name}`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -E "src/(components/ui/(Photo|ErrorState)|lib/snapshot|config/routes|store/cart|services/pricing|components/layout/CartLineItem|features/checkout/components/OrderSummary|features/order)"`
Expected: no output.

Run: `grep -rn "<Photo" src --include=*.tsx | grep " id="`
Expected: only lines in files Tasks 6-8 will migrate (ProductCard, ProductGallery, HeroSection, DeliverySection, CategoriesSection, TopSellingSection, GiftUnwrap, GiftPage). Nothing from this task's files.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Photo.tsx src/components/ui/ErrorState.tsx src/lib/snapshot.ts src/models/ui.ts src/config/routes.ts src/store/cart.ts src/services/pricing.ts src/components/layout/CartLineItem.tsx src/features/checkout/components/OrderSummary.tsx src/features/order/OrderConfirmationPage.tsx
git commit -m "refactor: URL-based Photo and cart lines that snapshot their product

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 6: Shop and product pages on the API

Repo: `gift-shoe-app` (part of the Task 4-8 compile unit).

**Files:**
- Modify: `src/features/shop/ShopPage.tsx`, `src/features/shop/lib/filters.ts`, `src/features/product/models/index.ts`, `src/features/product/components/ProductGallery.tsx`
- Rewrite: `src/components/product/ProductCard.tsx`, `src/features/product/ProductPage.tsx`

**Interfaces:**
- Consumes: `useGetProductsQuery`, `useGetProductQuery`, `useGetCategoriesQuery` (Task 4); `Photo`, `snapshotOf`, `ErrorState`, `productPath` (Task 5); `isNotFound` (Task 3).
- Produces: nothing new for later tasks (`ProductCard` keeps its `{ product, index }` props; it now also reads `product.slug`).

- [ ] **Step 1: ProductCard**

Replace `src/components/product/ProductCard.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useCart } from "@/store/cart";
import { Photo } from "@/components/ui/Photo";
import { formatKES } from "@/lib/format";
import { snapshotOf } from "@/lib/snapshot";
import { productPath } from "@/config/routes";
import type { ProductCardProps } from "@/models";

export function ProductCard({ product }: ProductCardProps) {
  const add = useCart((s) => s.add);
  const discount = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  return (
    <div className="group relative">
      <Link to={productPath(product.slug)} aria-label={`${product.name}, ${formatKES(product.price)}`} className="block">
        <div className="tile relative aspect-[4/5] bg-surface-2">
          <Photo src={product.image} alt={product.name} w={640} className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]" />
          <div className="absolute left-0 top-0 flex flex-col items-start">
            {!product.inStock && <span className="bg-surface px-2.5 py-1 text-xs font-semibold text-muted">Sold out</span>}
            {product.bestseller && <span className="bg-ink px-2.5 py-1 text-xs font-semibold text-on-ink">Bestseller</span>}
            {product.isNew && <span className="bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">New</span>}
            {discount > 0 && <span className="bg-surface px-2.5 py-1 text-xs font-semibold text-danger">-{discount}%</span>}
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium leading-snug">{product.name}</h3>
            <p className="mt-1 flex items-center gap-1.5">
              {product.colors.map((c) => (
                <span key={c.name} title={c.name} className="size-3 rounded-full border border-ink/20" style={{ background: c.hex }} />
              ))}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold tabular-nums">{formatKES(product.price)}</p>
            {product.compareAt && <p className="text-xs text-muted line-through tabular-nums">{formatKES(product.compareAt)}</p>}
          </div>
        </div>
      </Link>

      {/* Quick add: pointer devices only, so touch users go through the product page. */}
      {product.inStock && (
        <div className="absolute inset-x-0 top-0 hidden aspect-[4/5] items-end md:flex" aria-hidden={false}>
          <div className="pointer-events-none flex w-full translate-y-full flex-wrap gap-px bg-ink/90 p-2 opacity-0 backdrop-blur transition duration-300 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <span className="mb-1 w-full text-xs font-medium text-on-ink/70">Quick add</span>
            {product.sizes.slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => add({ productId: product.id, size: s, color: product.colors[0]?.name ?? "", snapshot: snapshotOf(product) })}
                className="min-h-9 min-w-9 flex-1 bg-on-ink/10 px-2 text-xs font-semibold text-on-ink transition hover:bg-accent hover:text-accent-ink"
                aria-label={`Add ${product.name} in size ${s} to bag`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton tile aspect-[4/5]" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-3 w-1/3" />
    </div>
  );
}
```

- [ ] **Step 2: Filters search no longer uses `blurb`**

In `src/features/shop/lib/filters.ts` replace the search line

```ts
      if (needle && !`${p.name} ${p.category} ${p.blurb}`.toLowerCase().includes(needle)) return false;
```
with
```ts
      if (needle && !`${p.name} ${p.categoryLabel}`.toLowerCase().includes(needle)) return false;
```

- [ ] **Step 3: ShopPage reads the API**

In `src/features/shop/ShopPage.tsx`:

1. Replace the imports `import { productsFor } from "@/data/products";`, `import { categoriesByGender } from "@/data/categories";` and the `SKELETON_MS` import. The imports block becomes:

```tsx
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Funnel, X } from "@phosphor-icons/react";
import type { CategoryDef, Product } from "@/models";
import type { FilterChip } from "@/features/shop/models";
import { useGetCategoriesQuery, useGetProductsQuery } from "@/api/catalogue";
import { useGender } from "@/store/gender";
import { formatKES } from "@/lib/format";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { PRICE_MAX, SORT_OPTIONS } from "@/features/shop/constants";
import { availableSizes, availableSwatches, filterProducts } from "@/features/shop/lib/filters";
import { useShopFilters } from "@/features/shop/hooks/useShopFilters";
import { FilterPanel } from "@/features/shop/components/FilterPanel";
import { FilterSheet } from "@/features/shop/components/FilterSheet";
import { EmptyResults } from "@/features/shop/components/EmptyResults";

const NO_PRODUCTS: Product[] = [];
const NO_CATEGORIES: CategoryDef[] = [];
```

2. Replace everything from `export default function ShopPage() {` down to and including the `useEffect` that sets the skeleton timer (the block ending `}, []);` before "Lock page scroll") with:

```tsx
export default function ShopPage() {
  const gender = useGender((s) => s.gender);
  const { filters, update, setList, reset } = useShopFilters();
  const [sheetOpen, setSheetOpen] = useState(false);

  // currentData (not data) so switching men/women never shows the other side's products.
  const productsQuery = useGetProductsQuery(gender);
  const categoriesQuery = useGetCategoriesQuery(gender);
  const pool = productsQuery.currentData ?? NO_PRODUCTS;
  const categories = categoriesQuery.currentData ?? NO_CATEGORIES;
  const loading = productsQuery.currentData === undefined && !productsQuery.isError;
  const failed = productsQuery.currentData === undefined && productsQuery.isError;

  const sizes = useMemo(() => availableSizes(pool), [pool]);
  const swatches = useMemo(() => availableSwatches(pool), [pool]);

  const deferredQuery = useDeferredValue(filters.q);
  const results = useMemo(() => filterProducts(pool, filters, deferredQuery), [pool, filters, deferredQuery]);
```

3. Replace the grid area's ternary `{loading ? ( ... ) : results.length === 0 ? ( ... ) : ( ... )}` opening so a failure shows the error state: change `{loading ? (` to

```tsx
          {failed ? (
            <ErrorState title="We could not load the shop" onRetry={() => void productsQuery.refetch()} />
          ) : loading ? (
```
(leave the rest of the ternary exactly as it is).

- [ ] **Step 4: Gallery and its props**

`src/features/product/models/index.ts`: change `import type { Gender, Product } from "@/models";` to `import type { Gender, ProductDetail } from "@/models";`, and replace `ProductGalleryProps` with:

```ts
export interface ProductGalleryProps {
  product: ProductDetail;
  /** Selected colour name, used in alt text. */
  color: string;
  /** Photo URLs to show for the selected colour. The first is the large hero image. */
  images: string[];
}
```

Replace `src/features/product/components/ProductGallery.tsx`:

```tsx
import type { ProductGalleryProps } from "@/features/product/models";
import { Photo } from "@/components/ui/Photo";

/** One large image followed by the remaining views for the selected colour. A product with no photos shows a placeholder. */
export function ProductGallery({ product, color, images }: ProductGalleryProps) {
  return (
    <div className="fade-in grid gap-2 sm:grid-cols-2">
      <div className="tile relative aspect-[4/5] bg-surface-2 sm:col-span-2 sm:aspect-[5/4]">
        <Photo src={images[0]} alt={`${product.name}, ${color}`} w={1400} eager position="50% 25%" className="h-full w-full" />
        {product.isNew && <span className="absolute left-0 top-0 bg-accent px-3 py-1 text-sm font-semibold text-accent-ink">New</span>}
      </div>
      {images.slice(1).map((src, i) => (
        <div key={`${i}-${src}`} className={`tile aspect-square bg-surface-2 ${images.length === 2 ? "sm:col-span-2 sm:aspect-[5/3]" : ""}`}>
          <Photo src={src} alt={`${product.name}, view ${i + 2}`} w={900} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: ProductPage**

Replace `src/features/product/ProductPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { CaretRight, Check, Gift, Package, Ruler, Star, Truck } from "@phosphor-icons/react";
import { isNotFound } from "@/api/baseApi";
import { useGetProductQuery, useGetProductsQuery } from "@/api/catalogue";
import { useCart } from "@/store/cart";
import { ProductGallery } from "@/features/product/components/ProductGallery";
import { SizeGuide } from "@/features/product/components/SizeGuide";
import { LOW_STOCK_AT } from "@/features/product/constants";
import { ProductCard } from "@/components/product/ProductCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatKES } from "@/lib/format";
import { snapshotOf } from "@/lib/snapshot";

export default function ProductPage() {
  const { slug = "" } = useParams();
  // currentData so moving between products shows the skeleton instead of the previous product.
  const { currentData: product, isError, error, refetch } = useGetProductQuery(slug);
  const { currentData: pool } = useGetProductsQuery(product?.gender ?? skipToken);
  const add = useCart((s) => s.add);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [needSize, setNeedSize] = useState(false);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);

  // Reset the selection only when a different product loads. A live refetch of the same product
  // (the editor changed a price) must not throw away the visitor's colour and size.
  useEffect(() => {
    setColor(product?.colors[0]?.name ?? "");
    setSize(product?.sizes.length === 1 ? product.sizes[0] : "");
    setNeedSize(false);
    window.scrollTo({ top: 0 });
  }, [product?.id]);

  if (!product) {
    if (isError && !isNotFound(error)) return <ErrorState title="We could not load this product" onRetry={() => void refetch()} />;
    if (isError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-32 text-center">
          <h1 className="display text-5xl">We could not find that product</h1>
          <p className="mt-3 text-muted">It may have sold out or moved.</p>
          <Link to="/shop" className="btn-dark mt-8">
            Back to the shop
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 md:px-8" aria-busy="true">
        <div className="skeleton mt-6 aspect-[5/4] w-full lg:w-[55%]" />
      </div>
    );
  }

  const related = (pool ?? []).filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const forColour = product.variants.filter((v) => v.colourName === null || v.colourName === color);
  const colourStock = forColour.reduce((n, v) => n + v.available, 0);
  const sizeSoldOut = (s: string) => forColour.filter((v) => v.size === s).every((v) => !v.inStock);
  const low = colourStock > 0 && colourStock <= LOW_STOCK_AT;
  const imgs = product.colorImages[color]?.length ? product.colorImages[color] : product.images;

  const addToBag = () => {
    if (!size) {
      setNeedSize(true);
      return;
    }
    add({ productId: product.id, size, color, snapshot: snapshotOf(product, imgs[0]) });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 md:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
        <Link to="/" className="hover:text-ink">Home</Link>
        <CaretRight size={12} />
        <Link to={`/shop?cat=${product.category}`} className="hover:text-ink">{product.categoryLabel}</Link>
        <CaretRight size={12} />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ProductGallery product={product} color={color} images={imgs} />

        <div className="lg:sticky lg:top-32 lg:self-start">
          <h1 className="mt-2 display text-5xl md:text-6xl">{product.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Star size={16} weight="fill" className="text-ink" /> {product.rating.toFixed(1)} · {product.sold} sold
          </p>
          <p className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">{formatKES(product.price)}</span>
            {product.compareAt && <span className="text-lg text-muted line-through tabular-nums">{formatKES(product.compareAt)}</span>}
          </p>
          {product.blurb && <p className="mt-5 max-w-[56ch] leading-relaxed text-muted">{product.blurb}</p>}

          <fieldset className="mt-8">
            <legend className="label">
              Colour: <span className="font-normal text-muted">{color}</span>
            </legend>
            <div className="mt-3 flex gap-3">
              {product.colors.map((c) => (
                <button key={c.name} aria-label={c.name} aria-pressed={c.name === color} onClick={() => setColor(c.name)} className={`size-11 rounded-full border-2 transition ${c.name === color ? "border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: c.hex }} />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <div className="flex items-center justify-between">
              <legend className="label">Size</legend>
              <button className="inline-flex items-center gap-1 text-sm underline underline-offset-4" onClick={() => setGuide((g) => !g)} aria-expanded={guide}>
                <Ruler size={16} /> Size guide
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const out = sizeSoldOut(s);
                return (
                  <button key={s} disabled={out} aria-pressed={size === s} onClick={() => { setSize(s); setNeedSize(false); }} className={`min-h-11 min-w-12 rounded-xl border px-4 text-sm transition disabled:cursor-not-allowed disabled:text-muted disabled:line-through disabled:opacity-50 ${size === s ? "border-ink bg-ink text-on-ink" : "border-line bg-surface hover:border-ink"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {needSize && (
              <p role="alert" className="mt-2 text-sm text-danger">
                Please choose a size first.
              </p>
            )}
            {guide && <SizeGuide gender={product.gender} />}
          </fieldset>

          {low && <p className="mt-5 text-sm font-medium text-danger">Only {colourStock} left in stock</p>}
          {!product.inStock && <p className="mt-5 text-sm font-medium text-danger">Sold out</p>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="btn-accent h-14 flex-1 text-base disabled:opacity-50" disabled={!product.inStock} onClick={addToBag}>
              {added ? (<><Check size={20} weight="bold" /> Added to bag</>) : "Add to bag"}
            </button>
            <Link to={`/gift?product=${product.slug}`} className="btn-ghost h-14 text-base">
              <Gift size={20} /> Send as a gift
            </Link>
          </div>

          <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
            <li className="flex items-start gap-3 py-4"><Truck size={22} className="mt-0.5 text-ink" /><span><strong className="font-medium">Nairobi:</strong> same-day delivery if you order before 2 pm. Other counties 2 to 5 days.</span></li>
            <li className="flex items-start gap-3 py-4"><Package size={22} className="mt-0.5 text-ink" /><span>Free returns within 7 days if it does not fit. Pay on delivery available in Nairobi.</span></li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="display text-4xl">Complete the look</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -E "src/(components/product|features/shop|features/product)/"`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/components/product/ProductCard.tsx src/features/shop src/features/product
git commit -m "feat: shop and product pages read from the API with live updates

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Task 7: Home page on the API

Repo: `gift-shoe-app` (part of the Task 4-8 compile unit).

**Files:**
- Create: `src/features/home/gridLayout.ts`
- Test: `src/features/home/gridLayout.test.ts`
- Rewrite: `src/features/home/models/index.ts`, `src/features/home/HomePage.tsx`, `src/features/home/components/HeroSection.tsx`, `src/features/home/components/DeliverySection.tsx`, `src/features/home/sections/TrustSection.tsx`, `src/features/home/sections/CategoriesSection.tsx`, `src/features/home/sections/TopSellingSection.tsx`, `src/features/home/sections/GiftTeaserSection.tsx`, `src/features/home/sections/ReviewsSection.tsx`
- Modify: `src/features/gift/components/GiftUnwrap.tsx`, `src/features/gift/models/index.ts`

**Interfaces:**
- Consumes: `useGetHomeQuery`, `useGetProductQuery`, `useGetZonesQuery` (Task 4); `HeroBlock`, `GiftBlock`, `TrustItem`, `CategoryDef`, `Product`, `Testimonial`, `DeliveryZoneInfo` (Task 4); `Photo`, `ErrorState` (Task 5); `unsplash`, `NAIROBI_SKYLINE` (Task 3).
- Produces: `pickLayout(g: Gender, slugs: string[]): { curated: boolean; layout: GridLayout }` in `src/features/home/gridLayout.ts`. `GiftUnwrapProps.product` is now `Product | undefined` with `Product.image`.

- [ ] **Step 1: Write the failing grid-layout test**

Create `src/features/home/gridLayout.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { pickLayout } from "./gridLayout.ts";

const men = ["suits", "shirts", "kaunda", "shoes", "trousers", "jackets", "tshirts", "accessories"];

test("uses the curated grid when the category set matches, in any order", () => {
  const { curated, layout } = pickLayout("men", [...men].reverse());
  assert.equal(curated, true);
  assert.deepEqual(layout.order, men);
  assert.ok(layout.place.suits.cls.includes("row-span-2"));
});

test("falls back when a category was removed", () => {
  assert.equal(pickLayout("men", men.slice(1)).curated, false);
});

test("falls back when a category was added", () => {
  assert.equal(pickLayout("men", [...men, "hats"]).curated, false);
});

test("falls back when there are no categories", () => {
  assert.equal(pickLayout("women", []).curated, false);
});

test("women have their own curated grid", () => {
  const women = ["dresses", "tops", "knitwear", "jackets", "trousers", "shoes", "accessories"];
  const { curated, layout } = pickLayout("women", women);
  assert.equal(curated, true);
  assert.equal(layout.rows, "lg:grid-rows-3");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (`Cannot find module './gridLayout.ts'`).

- [ ] **Step 3: Implement the grid layout**

Create `src/features/home/gridLayout.ts` (the Tailwind placement classes moved here verbatim from the old `home/config.ts`; the CMS controls order, label, tagline and image, not CSS):

```ts
import type { Gender } from "@/models";

export interface GridPlace {
  /** Tailwind classes placing the tile on the mobile flow and the lg grid. */
  cls: string;
  /** CSS object-position for the tile photo. */
  pos?: string;
}

export interface GridLayout {
  /** Tailwind rows class for the lg grid. */
  rows: string;
  /** DOM order (mobile flow). */
  order: string[];
  /** Placement per category slug, plus "all" for the call-to-action tile. */
  place: Record<string, GridPlace>;
}

const LAYOUTS: Record<Gender, GridLayout> = {
  men: {
    rows: "lg:grid-rows-4",
    order: ["suits", "shirts", "kaunda", "shoes", "trousers", "jackets", "tshirts", "accessories"],
    place: {
      suits: { cls: "col-span-2 row-span-2 lg:col-start-1 lg:row-start-1", pos: "50% 25%" },
      shirts: { cls: "lg:col-start-3 lg:row-start-1", pos: "50% 30%" },
      kaunda: { cls: "lg:col-start-3 lg:row-start-2", pos: "50% 20%" },
      shoes: { cls: "row-span-2 lg:col-start-4 lg:row-start-1", pos: "50% 50%" },
      trousers: { cls: "row-span-2 lg:col-start-3 lg:row-start-3", pos: "50% 70%" },
      jackets: { cls: "col-span-2 lg:col-start-1 lg:row-start-3", pos: "50% 35%" },
      tshirts: { cls: "lg:col-start-4 lg:row-start-3", pos: "50% 25%" },
      accessories: { cls: "lg:col-start-4 lg:row-start-4", pos: "50% 50%" },
      all: { cls: "col-span-2 lg:col-start-1 lg:row-start-4" },
    },
  },
  women: {
    rows: "lg:grid-rows-3",
    order: ["dresses", "tops", "knitwear", "jackets", "trousers", "shoes", "accessories"],
    place: {
      dresses: { cls: "col-span-2 row-span-2 lg:col-start-1 lg:row-start-1", pos: "50% 30%" },
      tops: { cls: "lg:col-start-3 lg:row-start-1", pos: "50% 40%" },
      knitwear: { cls: "lg:col-start-3 lg:row-start-2", pos: "50% 30%" },
      jackets: { cls: "col-span-2 lg:col-span-1 lg:row-span-2 lg:col-start-4 lg:row-start-1", pos: "50% 30%" },
      trousers: { cls: "lg:col-start-1 lg:row-start-3", pos: "50% 45%" },
      shoes: { cls: "lg:col-start-2 lg:row-start-3", pos: "50% 55%" },
      accessories: { cls: "lg:col-start-3 lg:row-start-3", pos: "50% 50%" },
      all: { cls: "lg:col-start-4 lg:row-start-3" },
    },
  },
};

/**
 * The hand-placed grid only fits the exact category set it was designed for. If an editor adds or
 * removes a category, `curated` is false and the section renders a plain uniform grid instead.
 */
export function pickLayout(g: Gender, slugs: string[]): { curated: boolean; layout: GridLayout } {
  const layout = LAYOUTS[g];
  const curated = slugs.length === layout.order.length && layout.order.every((s) => slugs.includes(s));
  return { curated, layout };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Home models and HomePage**

Replace `src/features/home/models/index.ts`:

```ts
import type { CategoryDef, Gender, GiftBlock, HeroBlock, Product, Testimonial, TrustItem } from "@/models";

/** Props shared by the gender-aware home sections. */
export interface HomeSectionProps {
  g: Gender;
}

export interface HeroSectionProps {
  g: Gender;
  c: HeroBlock;
}

export interface TrustSectionProps {
  items: TrustItem[];
}

export interface CategoriesSectionProps extends HomeSectionProps {
  title: string;
  categories: CategoryDef[];
}

export interface TopSellingSectionProps extends HomeSectionProps {
  title: string;
  products: Product[];
}

export interface GiftTeaserSectionProps extends HomeSectionProps {
  c: GiftBlock;
}

export interface ReviewsSectionProps extends HomeSectionProps {
  items: Testimonial[];
}
```

Replace `src/features/home/HomePage.tsx`:

```tsx
import { useGetHomeQuery } from "@/api/home";
import { useGender } from "@/store/gender";
import { ErrorState } from "@/components/ui/ErrorState";
import { HeroSection } from "@/features/home/components/HeroSection";
import { DeliverySection } from "@/features/home/components/DeliverySection";
import { TrustSection } from "@/features/home/sections/TrustSection";
import { CategoriesSection } from "@/features/home/sections/CategoriesSection";
import { TopSellingSection } from "@/features/home/sections/TopSellingSection";
import { GiftTeaserSection } from "@/features/home/sections/GiftTeaserSection";
import { ReviewsSection } from "@/features/home/sections/ReviewsSection";

export default function HomePage() {
  const g = useGender((s) => s.gender);
  // currentData so switching men/women never renders the other side's content.
  const { currentData: data, isError, refetch } = useGetHomeQuery(g);

  if (!data) {
    if (isError) return <ErrorState title="We could not load the store" onRetry={() => void refetch()} />;
    return (
      <div className="min-h-[calc(100dvh-68px)]" aria-busy="true">
        <div className="skeleton h-[60dvh] w-full" />
      </div>
    );
  }

  return (
    <>
      {data.hero && <HeroSection key={`hero-${g}`} g={g} c={data.hero} />}
      <TrustSection items={data.trust} />
      <CategoriesSection key={`cat-${g}`} g={g} title={data.sections?.categoriesTitle || "Shop by category"} categories={data.categories} />
      <TopSellingSection key={`top-${g}`} g={g} title={data.sections?.topProductsTitle || "Best sellers"} products={data.topProducts} />
      {data.gift && <GiftTeaserSection g={g} c={data.gift} />}
      <DeliverySection />
      <ReviewsSection key={`rev-${g}`} g={g} items={data.testimonials} />
    </>
  );
}
```

- [ ] **Step 6: Hero, Trust, Delivery**

In `src/features/home/components/HeroSection.tsx`:
- Replace the imports `import { byId } from "@/data/products";` with `import { skipToken } from "@reduxjs/toolkit/query";` and `import { useGetProductQuery } from "@/api/catalogue";` (keep the others; `HeroSectionProps` now comes from the new models file).
- Replace `const featured = byId(c.featured)!;` with:

```tsx
  const { currentData: featured } = useGetProductQuery(c.featuredProductSlug || skipToken);
```
- Replace the whole `const tag = ( ... );` block with a version that is null when the product is missing:

```tsx
  const tag = featured ? (
    <Link
      to={productPath(featured.slug)}
      className="group absolute bottom-0 left-0 z-10 flex items-center gap-4 bg-surface px-5 py-4 transition-colors hover:bg-ink hover:text-on-ink [border-radius:0_var(--r-tile)_0_0]"
    >
      <span>
        <span className="block text-xs text-muted group-hover:text-on-ink/70">Pictured</span>
        <span className="block font-semibold">{featured.name}</span>
        <span className="block text-sm tabular-nums">{formatKES(featured.price)}</span>
      </span>
      <ArrowUpRight size={22} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  ) : null;
```
- Change both hero photos: `<Photo id={c.image} alt={c.alt} w={1200} eager position={c.pos} className="h-full w-full" />` to `<Photo src={c.image} alt={c.alt} w={1200} eager position={c.focalPoint} className="h-full w-full" />`, and `<Photo id={c.image} alt={c.alt} w={1400} eager position={c.pos} className="h-full w-full" />` to `<Photo src={c.image} alt={c.alt} w={1400} eager position={c.focalPoint} className="h-full w-full" />`.

Replace `src/features/home/sections/TrustSection.tsx`:

```tsx
import { HandCoins, Package, Phone, Ruler, type Icon } from "@phosphor-icons/react";
import type { TrustSectionProps } from "@/features/home/models";

const ICONS: Record<string, Icon> = { phone: Phone, package: Package, ruler: Ruler, "hand-coins": HandCoins };

export function TrustSection({ items }: TrustSectionProps) {
  if (items.length === 0) return null;
  return (
    <section className="border-y border-ink/15 bg-surface">
      <ul className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {items.map((t) => {
          const Glyph = ICONS[t.icon] ?? Package;
          return (
            <li key={t.title}>
              <div className="flex items-start gap-4 px-4 py-5 md:px-8">
                <Glyph size={26} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-muted">{t.text}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

Replace `src/features/home/components/DeliverySection.tsx`:

```tsx
import { useGetZonesQuery } from "@/api/delivery";
import { NAIROBI_SKYLINE, unsplash } from "@/lib/media";
import { formatKES } from "@/lib/format";
import { Photo } from "@/components/ui/Photo";

/** Delivery fees by zone over a Nairobi skyline. Zones and fees come from the API. */
export function DeliverySection() {
  const { data: zones } = useGetZonesQuery();
  if (!zones || zones.length === 0) return null;
  const free = zones.find((z) => z.freeOver !== null);
  return (
    <section className="relative isolate overflow-hidden bg-[#0d0f0d] text-[#eceee8]">
      <Photo src={unsplash(NAIROBI_SKYLINE, 1600)} alt="Nairobi skyline at dusk reflected in water" w={1600} className="absolute inset-0 -z-10 opacity-50" position="50% 55%" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d0f0d] via-[#0d0f0d]/70 to-transparent" />
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <h2 className="display max-w-[14ch] text-[clamp(2.6rem,6vw,5.4rem)]">Delivered to every county.</h2>
        <dl className="mt-14 grid max-w-3xl gap-x-10 gap-y-8 sm:grid-cols-2">
          {zones.map((z) => (
            <div key={z.id} className="border-t border-[#eceee8]/30 pt-4">
              <dt className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">{z.label}</span>
                <span className="tabular-nums text-accent">{formatKES(z.fee)}</span>
              </dt>
              <dd className="mt-1 text-sm text-[#eceee8]/70">{z.eta}</dd>
            </div>
          ))}
        </dl>
        {free?.freeOver != null && (
          <p className="mt-10 text-sm text-[#eceee8]/70">
            Free delivery in {free.label} on orders above {formatKES(free.freeOver)}.
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Categories, Top sellers**

Replace `src/features/home/sections/CategoriesSection.tsx`:

```tsx
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { Photo } from "@/components/ui/Photo";
import { pickLayout } from "@/features/home/gridLayout";
import type { CategoriesSectionProps } from "@/features/home/models";

export function CategoriesSection({ g, title, categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null;
  // The hand-placed grid only fits the designed category set; otherwise fall back to a uniform grid.
  const { curated, layout } = pickLayout(g, categories.map((c) => c.slug));
  const ordered = curated ? layout.order.map((slug) => categories.find((c) => c.slug === slug)!) : categories;
  const total = categories.reduce((n, c) => n + c.count, 0);
  const first = ordered[0].slug;
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <h2 className="display max-w-[16ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">{title}</h2>

      <div className={`mt-12 grid auto-rows-[165px] grid-cols-2 gap-2 sm:auto-rows-[210px] md:gap-3 lg:grid-cols-4 ${curated ? layout.rows : ""}`}>
        {ordered.map((cat) => {
          const big = cat.slug === first;
          const place = curated ? layout.place[cat.slug] : undefined;
          return (
            <div key={cat.slug} className={place?.cls ?? ""}>
              <Link to={`/shop?cat=${cat.slug}`} className="tile group relative block h-full bg-surface-2">
                <Photo src={cat.image} alt={`${cat.label} collection`} w={big ? 1100 : 700} position={place?.pos} className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0d]/80 via-[#0d0f0d]/10 to-transparent" />
                <span className="absolute left-0 top-0 bg-accent px-2.5 py-1 text-xs font-bold tabular-nums text-accent-ink [border-radius:0_0_var(--r-soft)_0]">{cat.count}</span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-[#eceee8] md:p-5">
                  <div>
                    <p className={`display ${big ? "text-[clamp(2rem,3.6vw,3.4rem)]" : "text-[clamp(1.35rem,2vw,1.9rem)]"}`}>{cat.label}</p>
                    {(big || cat.slug === "jackets") && cat.tag && <p className="mt-2 hidden text-sm text-[#eceee8]/80 sm:block">{cat.tag}</p>}
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center bg-[#eceee8] text-[#0d0f0d] transition group-hover:bg-accent [border-radius:var(--r-soft)]">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            </div>
          );
        })}

        <div className={curated ? layout.place.all.cls : "col-span-2"}>
          <Link to="/shop" className="tile group flex h-full flex-col justify-between bg-accent p-5 text-accent-ink transition hover:bg-ink hover:text-on-ink md:p-6">
            <span className="display text-[clamp(1.6rem,2.6vw,2.4rem)]">Browse all {total} pieces</span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              Open the full shop <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

Replace `src/features/home/sections/TopSellingSection.tsx`:

```tsx
import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Photo } from "@/components/ui/Photo";
import { ProductCard } from "@/components/product/ProductCard";
import { formatKES } from "@/lib/format";
import { productPath } from "@/config/routes";
import type { TopSellingSectionProps } from "@/features/home/models";

export function TopSellingSection({ title, products }: TopSellingSectionProps) {
  const [lead, ...rest] = products.slice(0, 5);
  if (!lead) return null;
  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display max-w-[14ch] text-[clamp(2.4rem,5.2vw,4.6rem)]">{title}</h2>
          <Link to="/shop?sort=best" className="btn-ghost">
            See all bestsellers
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 lg:grid-cols-4">
          <div className="col-span-2 lg:row-span-2">
            <Link to={productPath(lead.slug)} className="tile group relative block h-full min-h-[460px] bg-surface-2">
              <Photo src={lead.image} alt={lead.name} w={1100} position="50% 25%" className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f0d]/80 via-transparent to-transparent" />
              <span className="absolute left-0 top-0 bg-ink px-3 py-1.5 text-sm font-semibold text-on-ink [border-radius:0_0_var(--r-soft)_0]">Best seller this month</span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-[#eceee8] md:p-7">
                <div>
                  <p className="display text-[clamp(1.8rem,3vw,2.8rem)]">{lead.name}</p>
                  <p className="mt-2 tabular-nums">{formatKES(lead.price)}</p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center bg-accent text-accent-ink transition group-hover:bg-[#eceee8] [border-radius:var(--r-soft)]">
                  <ArrowUpRight size={22} />
                </span>
              </div>
            </Link>
          </div>
          {rest.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Gift teaser, GiftUnwrap, Reviews**

In `src/features/gift/models/index.ts` change the first line to `import type { Product } from "@/models";` (unchanged) and leave `product: Product | undefined;` as is (the `Product` type is now the API-backed one).

In `src/features/gift/components/GiftUnwrap.tsx` change line ~76 `<Photo id={product.images[0]} alt={product.name} w={400} eager className="h-full w-full" />` to `<Photo src={product.image} alt={product.name} w={400} eager className="h-full w-full" />`.

Replace `src/features/home/sections/GiftTeaserSection.tsx`:

```tsx
import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetProductQuery } from "@/api/catalogue";
import { GiftUnwrap } from "@/features/gift/components/GiftUnwrap";
import type { GiftTeaserSectionProps } from "@/features/home/models";

export function GiftTeaserSection({ g, c }: GiftTeaserSectionProps) {
  const { currentData: product } = useGetProductQuery(c.productSlug || skipToken);
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <h2 className="display max-w-[12ch] text-[clamp(2.6rem,6vw,5.4rem)]">Some gifts deserve a reveal.</h2>
          <div>
            <p className="mt-6 max-w-[46ch] text-lg text-muted">Pick the piece, choose the box, write the card. Your recipient opens it with a small ceremony, right on their phone.</p>
            <div className="mt-8">
              <Link to="/gift" className="btn-accent group h-14 px-9 text-base">
                Build a gift <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
        <div className="min-h-[520px]">
          <GiftUnwrap key={g} instant product={product} color={c.colour} wrap={c.wrap} ribbon={c.ribbon} message={c.message} from={c.from} to={c.to} runKey={1} />
        </div>
      </div>
    </section>
  );
}
```

In `src/features/home/sections/ReviewsSection.tsx`:
- Remove `import { homeConfig } from "@/features/home/config";` and change `import type { HomeSectionProps } from "@/features/home/models";` to `import type { ReviewsSectionProps } from "@/features/home/models";`.
- Replace the component head, from `export function ReviewsSection({ g }: HomeSectionProps) {` through `const r = items[i];`, with:

```tsx
export function ReviewsSection({ g, items }: ReviewsSectionProps) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => setI(0), [g]);
  useEffect(() => {
    if (paused || reduce || count < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % count), 5000);
    return () => clearInterval(t);
  }, [paused, reduce, count]);

  if (count === 0) return null;
  const go = (n: number) => setI((n + count) % count);
  // The list can shrink live (an editor unpublishes a review), so keep the index in range.
  const r = items[Math.min(i, count - 1)];
```
- In the JSX replace `r.n` -> `r.name`, `r.q` -> `r.quote`, `r.w` -> `r.location` (the `<motion.figure key={r.n}`, the `<blockquote>`, the `<Avatar name={r.n} />`, and the two spans), and in the dots list `items.map((o, n) => (<button key={o.n} ... aria-label={`Show review from ${o.n}`} ...` -> `key={o.id}` and `${o.name}`. Also compare with `n === Math.min(i, count - 1)` for `aria-current` and the dot classes: replace each `n === i` with `n === Math.min(i, count - 1)`.

- [ ] **Step 9: Verify**

Run: `npm test`
Expected: PASS.

Run: `npx tsc --noEmit 2>&1 | grep -E "src/features/(home|gift/components|gift/models)/"`
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add src/features/home src/features/gift/components/GiftUnwrap.tsx src/features/gift/models/index.ts
git commit -m "feat: home page driven by API blocks, testimonials, categories and zones

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

(`src/features/home/config.ts` is deleted in Task 8, together with the other legacy data files.)

---

## Task 8: Gift page, remove the hardcoded data, full verification

Repo: `gift-shoe-app` (closes the Task 4-8 compile unit; `npm run build` is expected to pass at the end of this task).

**Files:**
- Modify: `src/features/gift/GiftPage.tsx`, `README.md`
- Delete: `src/data/products.ts`, `src/data/categories.ts`, `src/data/photos.ts`, `src/features/home/config.ts`
- Keep: `src/data/delivery.ts` (checkout still uses it)

**Interfaces:**
- Consumes: `useGetProductsQuery`, `useGetProductQuery` (Task 4); `Photo`, `snapshotOf` (Task 5).

- [ ] **Step 1: GiftPage on the API**

In `src/features/gift/GiftPage.tsx`:

1. Replace the imports `import { byId, productsFor } from "@/data/products";` with:

```tsx
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetProductQuery, useGetProductsQuery } from "@/api/catalogue";
import type { Product } from "@/models";
import { snapshotOf } from "@/lib/snapshot";
```
(`skipToken` is not needed; leave it out if unused. The page below does not use it.)

Final import block for the file:

```tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Gift as GiftIcon } from "@phosphor-icons/react";
import { useGetProductQuery, useGetProductsQuery } from "@/api/catalogue";
import type { Product } from "@/models";
import { useGender } from "@/store/gender";
import { GiftUnwrap } from "@/features/gift/components/GiftUnwrap";
import { MAX_MESSAGE_LENGTH, RIBBONS, WRAPS } from "@/features/gift/constants";
import { Photo } from "@/components/ui/Photo";
import { useCart } from "@/store/cart";
import { formatKES } from "@/lib/format";
import { snapshotOf } from "@/lib/snapshot";
import { GIFT_FEE } from "@/config/commerce";

const NO_PRODUCTS: Product[] = [];
```

2. Replace the state/logic block from `export default function GiftPage() {` through the end of `addGift` (the line `navigate("/checkout");` and its closing braces) with:

```tsx
export default function GiftPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const gender = useGender((st) => st.gender);
  const defaultSlug = gender === "men" ? "oxford-button-down" : "denim-shirt-dress";

  const { currentData: pool = NO_PRODUCTS } = useGetProductsQuery(gender);
  const gifts = useMemo(() => pool.filter((p) => p.inStock && (p.category !== "accessories" || p.price >= 1800)), [pool]);

  const [slug, setSlug] = useState(params.get("product") ?? defaultSlug);
  const { data: product, isError } = useGetProductQuery(slug);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [wrap, setWrap] = useState("burgundy");
  const [ribbon, setRibbon] = useState("gold");
  const [message, setMessage] = useState("Happy birthday, baba. You always dress for the moment. Here is one more reason.");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [error, setError] = useState("");

  const pick = (next: string) => {
    setSlug(next);
    setRunKey((k) => k + 1);
  };

  // Choose a colour and size when a different product loads (not on every live refetch of the same one).
  useEffect(() => {
    if (!product) return;
    setColor(product.colors[0]?.name ?? "");
    setSize(product.sizes[Math.min(2, product.sizes.length - 1)] ?? "");
  }, [product?.id]);

  // When the shop switches between men and women, move to a gift from that side.
  useEffect(() => {
    if (product && product.gender !== gender) pick(defaultSlug);
  }, [gender, product?.gender]);

  // The wanted product does not exist (any more): fall back to the first available gift.
  useEffect(() => {
    if (isError && gifts[0] && gifts[0].slug !== slug) pick(gifts[0].slug);
  }, [isError, gifts]);

  const addGift = () => {
    if (!product) return;
    if (!to.trim() || !from.trim()) {
      setError("Add the recipient's name and yours so the card is personal.");
      return;
    }
    setError("");
    add({
      productId: product.id,
      size,
      color,
      snapshot: snapshotOf(product, product.colorImages[color]?.[0]),
      gift: { wrap, ribbon, message: message.trim(), from: from.trim(), to: to.trim() },
    });
    navigate("/checkout");
  };

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-10 md:px-8 md:pt-14" aria-busy={!isError}>
        <h1 className="mt-2 display text-5xl md:text-7xl">Build a gift worth opening.</h1>
        <div className="skeleton mt-12 h-[420px] w-full" />
      </div>
    );
  }
```

3. In the JSX below: change the picker buttons (inside `gifts.slice(0, 8).map((p) => (`) from `key={p.id} onClick={() => pick(p.id)} aria-pressed={p.id === productId}` and `p.id === productId ? "border-ink" : "border-transparent"` to use `p.slug === slug`:

```tsx
                <button key={p.id} onClick={() => pick(p.slug)} aria-pressed={p.slug === slug} className={`tile relative overflow-hidden border-2 text-left transition ${p.slug === slug ? "border-ink" : "border-transparent"}`}>
                  <div className="aspect-square">
                    <Photo src={p.image} alt={p.name} w={300} className="h-full w-full" />
                  </div>
```
and the check badge `{p.id === productId && ...}` to `{p.slug === slug && ...}`. Everything else in the JSX (`product.colors`, `product.sizes`, `GiftUnwrap product={product}`, `product.name`, `product.price`) already matches the new `ProductDetail`.

- [ ] **Step 2: Delete the hardcoded data**

Run:

```bash
git rm src/data/products.ts src/data/categories.ts src/data/photos.ts src/features/home/config.ts
```

Run: `grep -rnE "@/data/(products|categories|photos)|home/config|byId\(|productsFor|topSellingFor|categoriesByGender|homeConfig" src`
Expected: no output. (`@/data/delivery` imports in checkout are expected and remain.)

- [ ] **Step 3: Full verification**

Run: `npm test`
Expected: PASS (media, events, adapters, gridLayout).

Run: `npm run build`
Expected: `tsc --noEmit` and `vite build` both exit 0. If `tsc` reports leftovers (for example another file still reading `product.images` or `product.stock`), fix that file to use the new `Product`/`ProductDetail` fields; do not re-add legacy data.

- [ ] **Step 4: Document running against the API**

Append to `README.md`:

```md

## Running against the Jabali API

The storefront reads products, categories, home content, testimonials and delivery zones from `jabali-be`.

1. Start the backend (`jabali-be`): `npm run db:up`, `npm run migrate:dev`, `npm run seed`, `npm run start:dev` (API on `http://localhost:5000/api/v1`).
2. Copy `.env.example` to `.env` if the API is elsewhere, and set `VITE_API_URL`.
3. `npm run dev` (the backend's `CORS_ORIGINS` already allows `http://localhost:5173`).

Edits published in the dashboard appear in open storefront tabs within about a second: the backend streams invalidation events on `GET /store/events` and the storefront refetches the affected queries. Cart, checkout and payments are not wired to the API yet.
```

- [ ] **Step 5: Manual end-to-end check (record what you saw)**

Start `jabali-be` (`npm run start:dev`), the dashboard (`npm run dev` in `jabali-dashboard`, sign in as `admin@jabali.co.ke`), and the storefront (`npm run dev`). Open the storefront home page, a product page and the shop in separate tabs. Then, in the dashboard:

- [ ] Edit the `home.hero.men` block headline and publish: the home tab's hero text changes without a reload.
- [ ] Edit that block and do NOT publish: nothing changes on the storefront.
- [ ] Change a product's price: the open product page and shop card show the new price; on the product page the chosen colour and size stay selected (Review Focus 5).
- [ ] Add a testimonial: it appears in the home reviews carousel.
- [ ] Change a delivery zone fee: the home delivery list updates.
- [ ] Rename a category: its tile label updates. Delete or add a category: the home grid falls back to the uniform layout and nothing breaks (Review Focus 3).
- [ ] Stop `jabali-be`, reload the storefront: home, shop and product pages each show "We could not load..." with a working "Try again" once the backend is back (Review Focus 1).
- [ ] With the storefront open, stop and restart `jabali-be`, then publish an edit: the tab catches up (re-open triggers a full resync; Review Focus 5).
- [ ] Add an item to the bag, open the bag drawer and `/checkout`: the line shows the name, image and the price it was added at.

- [ ] **Step 6: Commit**

```bash
git add src/features/gift/GiftPage.tsx README.md
git commit -m "feat: gift page on the API; remove hardcoded catalogue and home content

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

(`git rm` already staged the deletions; confirm with `git status` that only the intended files are in the commit.)

---

## Self-review (done while writing)

- **Spec coverage:** RTK Query layer shaped like the dashboard (Tasks 3-4); content from the server for products, categories, home blocks, testimonials, zones (Tasks 4, 6, 7, 8); realtime via SSE with cache-clear-before-emit, audit hook, orders hook, scheduled-publish hook (Tasks 1-2); storefront subscriber with reconnect resync and tab-hidden pause (Task 3); error states (Tasks 5-7); grid-placement decision (Task 7); tests as specified (unit + e2e on the backend, `tsc`/build + manual in the storefront). Spec items changed during planning are listed under "Deviations".
- **Placeholders:** none. Every code step shows the code.
- **Type consistency:** `Product.slug`/`image`/`categoryLabel`/`inStock`, `ProductDetail.colorImages`/`variants`, `CartLine.snapshot`, `Photo src`, `productPath(slug)`, hook names and tag names are the same in every task that uses them.
