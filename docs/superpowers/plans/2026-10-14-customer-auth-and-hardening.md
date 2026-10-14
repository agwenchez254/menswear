# Customer Auth, Security Hardening and Transactional Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customers must sign in or create an account to check out (backend accounts, tokens and order linking, plus a storefront gate), the storefront and its public API are hardened to OWASP ASVS Level 2 with a mapping to ISO/IEC 27001 Annex A, and the backend sends a welcome email on sign-up and an order confirmation with the receipt in the message body.

**Architecture:** Backend: new `CustomerAccount`/`CustomerRefreshToken` tables, a `store/auth/*` module cloned from the staff auth patterns, a token-type claim so customer and staff tokens cannot cross over, orders that require a customer token, then in-process rate limiting, explicit helmet and config validation, structured security logging and a dependency audit fix. Storefront: an auth slice and RTK Query auth endpoints that attach `Authorization` only to authenticated calls, a checkout gate with a sign-in/sign-up panel, then a build-time `_headers` generator with a strict CSP, safe image URLs and source-scan tests.

**Tech Stack:** NestJS 11, Prisma, argon2, `@nestjs/jwt`, helmet, zod, nodemailer (SMTP), Jest, `smtp-server` + `mailparser` for tests (backend); React 19, Vite 8, RTK Query, Node 24 `node --test` (storefront).

**Specs:**
- `gift-shoe-app/docs/superpowers/specs/2026-10-14-customer-auth-design.md`
- `gift-shoe-app/docs/superpowers/specs/2026-10-14-security-hardening-design.md`
- `gift-shoe-app/docs/superpowers/specs/2026-10-14-transactional-email-design.md`

**Repos:** `jabali-be` (Tasks 1-4, 8-11, 13-16), `gift-shoe-app` (Tasks 5-7, 12). Both are on their current branches (`feat/modulith` and `main`); the user has unrelated uncommitted work in `jabali-be`, so every commit there uses explicit pathspecs (`git commit -m ... -- <paths>`), never a bare `git commit`.

## Deviations from the specs (found while planning; confirm at review)

1. **Rate limiting is an in-house limiter, not `@nestjs/throttler`.** Per-email limits (the spec's 5/minute per email on login) and a concurrent-stream cap do not fit the library's single-tracker model, and an in-process limiter adds no new dependency to a security-sensitive path. Behaviour matches the spec (limits, `Retry-After`, problem+json 429). Same single-instance caveat as the spec.
2. **Header account control is a link to a small `/account` page** (shows name, email, phone and a Sign out button), not a dropdown. Same function, far less UI code.
3. **Migration is generated offline** with `prisma migrate diff` and applied only to the test database by the e2e setup. The developer's dev database is NOT migrated by this plan; run `npm run migrate:deploy` there before using customer endpoints.
4. **Backend e2e cannot place a real order** (the test DB has no catalogue). Task 4 covers order auth with 401/400 e2e checks plus a unit test of the idempotency-key ownership rule with a stubbed Prisma.

## Global Constraints

- Customer access tokens carry `typ: "customer"`; staff tokens have no `typ`. The staff `JwtAuthGuard` rejects `typ === "customer"`; `CustomerAuthGuard` accepts only it. One shared JWT secret.
- Password policy: 12 to 128 characters, rejected if in the common-password list, a single repeated character, or contains the email's local part (6+ characters) or equals the email. No composition rules.
- Account lockout: 5 failed logins lock the account for 15 minutes. Login failures are always the generic message "Invalid email or password"; unknown emails run a dummy argon2 verify.
- Refresh tokens rotate; reuse of a rotated token revokes the whole family.
- argon2id parameters: memory 65536 KiB, time 3, parallelism 4.
- `POST /store/orders` requires a customer token (401 otherwise); the order attaches to the account's `Customer`.
- Rate limits: default 120/min/IP; login 10/min/IP and 5/min/email; register 5/min/IP; refresh 30/min/IP; `/store/events` max 5 concurrent streams/IP. Limits can be disabled only outside production (`RATE_LIMIT_ENABLED=false`; production config rejects it).
- Production config rejects `*` and non-`https:` CORS origins; Swagger is disabled in production.
- Storefront: access token in memory only; refresh token and user in `localStorage` key `jabali-customer-auth`; `Authorization` is attached only to `getMe` and `updateMe`.
- CSP: `script-src 'self'` plus the SHA-256 of each inline script, never `'unsafe-inline'` or `'unsafe-eval'` for scripts; `style-src` keeps `'unsafe-inline'` (documented exception).
- Email: SMTP via nodemailer; `SMTP_URL` empty means a log-only transport (dev/test), production refuses to start without it and requires `STORE_URL` over https; sending is fire-and-forget (never blocks or fails a request), 3 attempts at 0 s, 2 s, 10 s; recipient masked in logs and bodies never logged; every interpolated template value is HTML-escaped; subjects have CR/LF stripped; links use only `STORE_URL`; the receipt is in the message body (HTML plus plain text), not an attachment.
- No new test framework: backend Jest (`npx jest --selectProjects unit|e2e --runInBand <name>`), storefront `node --test` (tested modules import only each other with an explicit `.ts` extension and otherwise `import type`).
- Never run `npm run build` in `gift-shoe-app` (it rewrites the tracked, already-dirty `dist/`); verify with `npx tsc --noEmit` and `npx vite build --outDir "$TEMP/gsa-dist" --emptyOutDir`.
- Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. In `gift-shoe-app` add explicit paths only.

## Review Focus

Failure modes the spec implies that no happy-path test covers, each pinned by a test or step below:

1. **A customer token must never reach an admin route, and a staff token must never act as a customer** (Task 2 guard spec, Task 3 e2e).
2. **Replaying an `Idempotency-Key` with a different customer's token** must not return the first customer's order (Task 4 unit test).
3. **Two simultaneous sign-ups with the same email or phone** must give 409, not 500 (Task 3 e2e, error mapping on P2002).
4. **The access token expires or the refresh token is revoked mid-checkout:** expect one silent refresh and retry; if refresh fails, the sign-in panel appears and the bag is kept (Task 6 helpers, Task 7 manual check).
5. **A CSP that blocks the page** (inline theme script hash not matching, API origin missing from `connect-src`): the build must fail loudly rather than ship a blank site (Task 12 tests and build check).
6. **Hostile text in names and addresses** (`<script>`, quotes, line breaks) must never appear unescaped in an email body or subject (Task 15 tests).
7. **The SMTP server is down or slow:** registering and ordering must still succeed and respond promptly; the email is retried, then given up with a log line (Task 14 unit test, Task 16 e2e).

---

# Part A: Customer authentication

## Task 1: Password policy

Repo: `jabali-be`.

**Files:**
- Create: `src/customer-auth/password-policy.ts`
- Test: `src/customer-auth/password-policy.spec.ts`

**Interfaces:**
- Produces: `PASSWORD_MIN = 12`, `PASSWORD_MAX = 128`, `checkPassword(password: string, email: string): string | null` (a user-facing message, or `null` when acceptable).

- [ ] **Step 1: Write the failing test**

Create `src/customer-auth/password-policy.spec.ts`:

```ts
import { checkPassword, PASSWORD_MAX, PASSWORD_MIN } from './password-policy';

describe('checkPassword', () => {
  const email = 'amina.said@example.com';

  it('accepts a long, unusual password', () => {
    expect(checkPassword('correct horse battery staple', email)).toBeNull();
  });

  it('rejects passwords shorter than the minimum', () => {
    expect(checkPassword('a'.repeat(PASSWORD_MIN - 1), email)).toMatch(/at least 12/);
  });

  it('accepts exactly the minimum length', () => {
    expect(checkPassword('Tr4mpoline-Bk', email)).toBeNull();
  });

  it('rejects passwords longer than the maximum', () => {
    expect(checkPassword('x1'.repeat(PASSWORD_MAX), email)).toMatch(/at most 128/);
  });

  it('rejects common passwords, ignoring case', () => {
    expect(checkPassword('PASSWORD12345', email)).toMatch(/too common/);
    expect(checkPassword('qwertyuiop12', email)).toMatch(/too common/);
  });

  it('rejects a single repeated character', () => {
    expect(checkPassword('z'.repeat(14), email)).toMatch(/too easy to guess/);
  });

  it('rejects the email itself and its local part', () => {
    expect(checkPassword('Amina.Said@Example.com', email)).toMatch(/email/);
    expect(checkPassword('xx-amina.said-xx-1', email)).toMatch(/email/);
  });

  it('ignores very short email local parts', () => {
    expect(checkPassword('abcd-efgh-ijkl-mnop', 'ab@example.com')).toBeNull();
  });

  it('counts characters, not bytes', () => {
    expect(checkPassword('🔐'.repeat(12), email)).toMatch(/too easy to guess/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest --selectProjects unit password-policy`
Expected: FAIL with "Cannot find module './password-policy'".

- [ ] **Step 3: Implement**

Create `src/customer-auth/password-policy.ts`:

```ts
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/** Common passwords that are long enough to pass the length rule (lowercase). */
const COMMON = new Set([
  'password1234',
  'password12345',
  'password123456',
  'password!234',
  'passw0rd1234',
  '123456789012',
  '1234567890123',
  '12345678901234',
  'qwertyuiop12',
  'qwertyuiopas',
  'qwertyuiop123',
  'qwertyuiopasdf',
  'iloveyou1234',
  'administrator',
  'welcome12345',
  'letmein12345',
  'abcdefghijkl',
  'abcdefghijklmnop',
  '1q2w3e4r5t6y',
  '1qaz2wsx3edc',
  'qazwsxedcrfv',
  'changeme1234',
  'jabali123456',
  'jabali@12345',
  'kenya1234567',
  'nairobi12345',
  'trustno1trustno1',
  'monkey123456',
]);

/** A user-facing reason the password is unacceptable, or null when it is fine. */
export function checkPassword(password: string, email: string): string | null {
  const length = [...password].length;
  if (length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters`;
  if (length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters`;
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return 'That password is too common';
  if (/^(.)\1+$/u.test(password)) return 'That password is too easy to guess';
  const mail = email.trim().toLowerCase();
  const local = mail.split('@')[0] ?? '';
  if (lower === mail || (local.length >= 6 && lower.includes(local))) return 'Do not use your email in your password';
  return null;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest --selectProjects unit password-policy`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/customer-auth/password-policy.ts src/customer-auth/password-policy.spec.ts
git commit -m "feat: customer password policy

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/customer-auth/password-policy.ts src/customer-auth/password-policy.spec.ts
```

---

## Task 2: Schema, migration and token-type isolation

Repo: `jabali-be`.

**Files:**
- Modify: `prisma/schema.prisma`, `src/common/auth/auth.types.ts`, `src/common/auth/guards.ts`
- Create: `prisma/migrations/20261014180000_customer_accounts/migration.sql`, `src/common/auth/customer.guard.ts`, `src/common/auth/customer.decorators.ts`
- Test: `src/common/auth/guards.spec.ts`

**Interfaces:**
- Produces (Tasks 3-4 rely on these exact names):
  - `auth.types.ts`: `CustomerAuthUser { accountId: string; customerId: string; email: string; name: string }`, `CustomerTokenPayload { sub: string; typ: 'customer'; cid: string; email: string; name: string }`
  - `CustomerAuthGuard` (`src/common/auth/customer.guard.ts`): sets `req.customer: CustomerAuthUser`; 401 for anything but a valid `typ:'customer'` token.
  - `CurrentCustomer` param decorator (`src/common/auth/customer.decorators.ts`) returning `CustomerAuthUser`.
  - Prisma models `CustomerAccount` (`customerAccount`) and `CustomerRefreshToken` (`customerRefreshToken`), enum `AccountStatus`.

- [ ] **Step 1: Write the failing guard spec**

Create `src/common/auth/guards.spec.ts`:

```ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomerAuthGuard } from './customer.guard';
import { JwtAuthGuard } from './guards';

const jwt = new JwtService({ secret: 'x'.repeat(40), signOptions: { expiresIn: 60 } });

const ctx = (token?: string) => {
  const req: Record<string, unknown> = { headers: token ? { authorization: `Bearer ${token}` } : {} };
  return { req, context: { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext };
};

const staffToken = () => jwt.signAsync({ sub: 's1', email: 's@x.co', name: 'S', role: 'owner', permissions: ['order:read'] });
const customerToken = () => jwt.signAsync({ sub: 'a1', typ: 'customer', cid: 'c1', email: 'c@x.co', name: 'C' });

describe('JwtAuthGuard (staff)', () => {
  const guard = new JwtAuthGuard(jwt);

  it('accepts a staff token', async () => {
    const { req, context } = ctx(await staffToken());
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect((req.user as { id: string }).id).toBe('s1');
  });

  it('rejects a customer token', async () => {
    const { context } = ctx(await customerToken());
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('CustomerAuthGuard', () => {
  const guard = new CustomerAuthGuard(jwt);

  it('accepts a customer token and exposes the customer', async () => {
    const { req, context } = ctx(await customerToken());
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.customer).toEqual({ accountId: 'a1', customerId: 'c1', email: 'c@x.co', name: 'C' });
  });

  it('rejects a staff token', async () => {
    const { context } = ctx(await staffToken());
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a missing, malformed or expired token', async () => {
    await expect(guard.canActivate(ctx().context)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(ctx('not-a-jwt').context)).rejects.toBeInstanceOf(UnauthorizedException);
    const expired = await new JwtService({ secret: 'x'.repeat(40) }).signAsync({ sub: 'a1', typ: 'customer', cid: 'c1', email: 'c@x.co', name: 'C' }, { expiresIn: -10 });
    await expect(guard.canActivate(ctx(expired).context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest --selectProjects unit guards.spec`
Expected: FAIL with "Cannot find module './customer.guard'".

- [ ] **Step 3: Types, guard and decorator**

Append to `src/common/auth/auth.types.ts`:

```ts

/** What a verified customer access token tells the API about the caller. */
export interface CustomerAuthUser {
  accountId: string;
  customerId: string;
  email: string;
  name: string;
}

/** Customer access-token claims. `typ` keeps these tokens out of the staff guard (same signing secret). */
export interface CustomerTokenPayload {
  sub: string;
  typ: 'customer';
  cid: string;
  email: string;
  name: string;
}
```

Create `src/common/auth/customer.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { CustomerAuthUser, CustomerTokenPayload } from './auth.types';

/** Requires a valid customer access token (`typ: "customer"`). Staff tokens are rejected. */
@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { customer?: CustomerAuthUser }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');
    let payload: CustomerTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<CustomerTokenPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (payload.typ !== 'customer') throw new UnauthorizedException('Invalid or expired token');
    req.customer = { accountId: payload.sub, customerId: payload.cid, email: payload.email, name: payload.name };
    return true;
  }
}
```

Create `src/common/auth/customer.decorators.ts`:

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { CustomerAuthUser } from './auth.types';

export const CurrentCustomer = createParamDecorator((_: unknown, ctx: ExecutionContext): CustomerAuthUser => {
  return ctx.switchToHttp().getRequest<Request & { customer: CustomerAuthUser }>().customer;
});
```

In `src/common/auth/guards.ts`, in `JwtAuthGuard.canActivate` change the verify line and add the rejection:

```ts
      const p = await this.jwt.verifyAsync<AccessTokenPayload & { typ?: string }>(header.slice(7));
      if (p.typ === 'customer') throw new UnauthorizedException('Invalid or expired token');
      req.user = { id: p.sub, email: p.email, name: p.name, role: p.role, permissions: p.permissions };
      return true;
```
(the surrounding `try { ... } catch { throw new UnauthorizedException('Invalid or expired token'); }` already turns the thrown error into the same 401).

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest --selectProjects unit guards.spec`
Expected: PASS (5 tests).

- [ ] **Step 5: Schema and migration**

Add to `prisma/schema.prisma`: in `model Customer`, add the line `account CustomerAccount?` after `orders Order[]`, and append:

```prisma
enum AccountStatus {
  active
  disabled
}

model CustomerAccount {
  id           String        @id @default(uuid()) @db.Uuid
  customerId   String        @unique @db.Uuid
  email        String        @unique
  passwordHash String
  status       AccountStatus @default(active)
  failedLogins Int           @default(0)
  lockedUntil  DateTime?
  lastLoginAt  DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  customer      Customer               @relation(fields: [customerId], references: [id], onDelete: Cascade)
  refreshTokens CustomerRefreshToken[]

  @@map("customer_accounts")
}

model CustomerRefreshToken {
  id           String    @id @default(uuid()) @db.Uuid
  accountId    String    @db.Uuid
  tokenHash    String    @unique
  familyId     String    @db.Uuid
  expiresAt    DateTime
  revokedAt    DateTime?
  replacedById String?   @db.Uuid
  ip           String?
  userAgent    String?
  createdAt    DateTime  @default(now())

  account CustomerAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([familyId])
  @@index([accountId])
  @@map("customer_refresh_tokens")
}
```

Generate the migration offline (no database is touched) and the client:

```bash
git show HEAD:prisma/schema.prisma > "$TEMP/schema.old.prisma"
mkdir -p prisma/migrations/20261014180000_customer_accounts
npx prisma migrate diff --from-schema-datamodel "$TEMP/schema.old.prisma" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20261014180000_customer_accounts/migration.sql
npx prisma generate
```

Read `migration.sql`. Expected: it creates enum `AccountStatus`, tables `customer_accounts` and `customer_refresh_tokens`, unique indexes on `customer_accounts.customerId`, `customer_accounts.email` and `customer_refresh_tokens.tokenHash`, the two secondary indexes, and the two cascading foreign keys. It must not alter or drop anything existing.

- [ ] **Step 6: Verify the migration applies and the build compiles**

Run: `npm run build`
Expected: exits 0.

Run: `npx jest --selectProjects e2e --runInBand store-events`
Expected: PASS (2 tests). The e2e global setup runs `prisma migrate deploy` against the test database, which proves the new migration applies cleanly.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261014180000_customer_accounts src/common/auth/auth.types.ts src/common/auth/guards.ts src/common/auth/customer.guard.ts src/common/auth/customer.decorators.ts src/common/auth/guards.spec.ts
git commit -m "feat: customer account schema and token-type isolation

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- prisma/schema.prisma prisma/migrations/20261014180000_customer_accounts src/common/auth/auth.types.ts src/common/auth/guards.ts src/common/auth/customer.guard.ts src/common/auth/customer.decorators.ts src/common/auth/guards.spec.ts
```

---

## Task 3: Customer auth module (register, login, refresh, logout, me)

Repo: `jabali-be`.

**Files:**
- Create: `src/customer-auth/customer-auth.dto.ts`, `src/customer-auth/customer-auth.service.ts`, `src/customer-auth/customer-auth.controller.ts`, `src/customer-auth/customer-auth.module.ts`, `test/helpers/app.ts`
- Modify: `src/app.module.ts`
- Test: `test/customer-auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `CustomerAuthGuard`, `CurrentCustomer`, `CustomerTokenPayload`, Prisma `customerAccount`/`customerRefreshToken` (Task 2); `checkPassword` (Task 1); `hashToken` from `src/auth/auth.service`; `normalizePhone`, `isUniqueViolation` from `src/common/utils`; `DomainError`.
- Produces: `CustomerAuthService` with `register(dto, meta)`, `login(email, password, meta)`, `refresh(raw, meta)`, `logout(raw)`, `me(accountId)`, `updateMe(accountId, dto)`. HTTP (all under `/api/v1`): `POST /store/auth/register` (201), `POST /store/auth/login` (200), `POST /store/auth/refresh` (200), `POST /store/auth/logout` (204), `GET /store/me`, `PATCH /store/me`. Auth responses: `{ customer: {id,name,email,phone}, accessToken, refreshToken, expiresIn, refreshExpiresAt }`. `test/helpers/app.ts` exports `bootApp(env?)`, `json(body, headers?)`.

- [ ] **Step 1: Test helper and the failing e2e**

Create `test/helpers/app.ts`:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import { loadConfig } from '../../src/config/config';
import { configureApp } from '../../src/setup';

export const TEST_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://jabali:jabali_dev_pw@localhost:5439/jabali_test?schema=public';

/** Boots the whole app on a random port against the test database. Env overrides apply before the app loads. */
export async function bootApp(env: Record<string, string> = {}): Promise<{ app: NestExpressApplication; base: string }> {
  // Env is shared across e2e files in one process, so every default is set explicitly each time.
  Object.assign(process.env, { DATABASE_URL: TEST_URL, ENABLE_SCHEDULER: 'false', RATE_LIMIT_ENABLED: 'true' }, env);
  const { AppModule } = await import('../../src/app.module');
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = mod.createNestApplication<NestExpressApplication>();
  configureApp(app, loadConfig());
  await app.listen(0);
  const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api/v1`;
  return { app, base };
}

export const json = (body: unknown, headers: Record<string, string> = {}, method = 'POST'): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
});
```

Create `test/customer-auth.e2e-spec.ts`:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../src/prisma/prisma.service';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup';
import { bootApp, json } from './helpers/app';

jest.setTimeout(60_000);

const PASSWORD = 'Sunrise-over-Nairobi-42';
let seq = 0;
const uniq = () => ++seq;
const phoneFor = (n: number) => `07${String(10000000 + n).slice(-8)}`; // 07 + 8 digits

describe('customer auth', () => {
  let app: NestExpressApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await bootApp({ RATE_LIMIT_ENABLED: 'false' }));
  });
  afterAll(async () => {
    await app.close();
  });

  const register = (over: Record<string, unknown> = {}) => {
    const n = uniq();
    const body = { name: 'Amina Said', email: `amina${n}@example.com`, phone: phoneFor(n), password: PASSWORD, ...over };
    return { body, res: fetch(`${base}/store/auth/register`, json(body)) };
  };
  const login = (email: string, password: string) => fetch(`${base}/store/auth/login`, json({ email, password }));
  const authed = (token: string) => ({ authorization: `Bearer ${token}` });

  it('registers, returns tokens and the customer, and /store/me works with the token', async () => {
    const { body, res } = register();
    const r = await res;
    expect(r.status).toBe(201);
    const data = (await r.json()) as { customer: { id: string; email: string; phone: string }; accessToken: string; refreshToken: string };
    expect(data.customer.email).toBe(body.email);
    expect(data.customer.phone).toMatch(/^\+2547\d{8}$/);
    expect(data.accessToken.length).toBeGreaterThan(20);
    const me = await fetch(`${base}/store/me`, { headers: authed(data.accessToken) });
    expect(me.status).toBe(200);
    expect(((await me.json()) as { email: string }).email).toBe(body.email);
  });

  it('lower-cases the email and rejects a duplicate regardless of case', async () => {
    const first = register({ email: 'MixedCase@Example.com' });
    expect((await first.res).status).toBe(201);
    const dup = register({ email: 'mixedcase@example.com' });
    const r = await dup.res;
    expect(r.status).toBe(409);
  });

  it('rejects a phone that already has an account', async () => {
    const first = register();
    expect((await first.res).status).toBe(201);
    const dup = register({ phone: first.body.phone });
    expect((await dup.res).status).toBe(409);
  });

  it('rejects an invalid phone and weak passwords with 422', async () => {
    expect((await register({ phone: '12345' }).res).status).toBe(422);
    expect((await register({ password: 'short' }).res).status).toBe(422);
    expect((await register({ password: 'password12345' }).res).status).toBe(422);
  });

  it('gives 409 (not 500) when the same email registers twice at once', async () => {
    const n = uniq();
    const mk = (suffix: number) => fetch(`${base}/store/auth/register`, json({ name: 'Race', email: `race${n}@example.com`, phone: phoneFor(900000 + n * 10 + suffix), password: PASSWORD }));
    const results = await Promise.all([mk(1), mk(2), mk(3)]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409]);
  });

  it('claims an existing guest customer by phone', async () => {
    const prisma = app.get(PrismaService);
    const n = uniq();
    const guest = await prisma.customer.create({ data: { name: 'Guest Buyer', phone: `+2547${String(30000000 + n).slice(-8)}` } });
    const r = await register({ phone: `0${guest.phone.slice(4)}`, name: 'Now Registered' }).res;
    expect(r.status).toBe(201);
    expect(((await r.json()) as { customer: { id: string } }).customer.id).toBe(guest.id);
  });

  it('logs in with the right password and gives one generic error for every failure', async () => {
    const { body } = register();
    await (await register({ email: 'unused@example.com' }).res).text();
    const created = await fetch(`${base}/store/auth/register`, json({ ...body, email: body.email, phone: phoneFor(uniq() + 500000) }));
    expect(created.status).toBe(201);
    expect((await login(body.email, PASSWORD)).status).toBe(200);
    const wrong = await login(body.email, 'not-the-password-123');
    const unknown = await login('nobody-here@example.com', PASSWORD);
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(((await wrong.json()) as { detail?: string; message?: string }).detail ?? '').toBe(((await unknown.json()) as { detail?: string }).detail ?? '');
  });

  it('locks the account after five failed logins, even for the right password', async () => {
    const { body, res } = register();
    expect((await res).status).toBe(201);
    for (let i = 0; i < 5; i++) expect((await login(body.email, `wrong-password-${i}-xx`)).status).toBe(401);
    expect((await login(body.email, PASSWORD)).status).toBe(401);
  });

  it('rotates the refresh token and revokes the whole family when an old one is reused', async () => {
    const { res } = register();
    const first = (await (await res).json()) as { refreshToken: string };
    const refresh = (token: string) => fetch(`${base}/store/auth/refresh`, json({ refreshToken: token }));
    const second = await refresh(first.refreshToken);
    expect(second.status).toBe(200);
    const rotated = (await second.json()) as { refreshToken: string; accessToken: string };
    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    expect((await refresh(first.refreshToken)).status).toBe(401); // reuse of the rotated token
    expect((await refresh(rotated.refreshToken)).status).toBe(401); // family revoked
  });

  it('logout revokes the refresh token', async () => {
    const { res } = register();
    const t = (await (await res).json()) as { refreshToken: string };
    expect((await fetch(`${base}/store/auth/logout`, json({ refreshToken: t.refreshToken }))).status).toBe(204);
    expect((await fetch(`${base}/store/auth/refresh`, json({ refreshToken: t.refreshToken }))).status).toBe(401);
  });

  it('PATCH /store/me updates the name', async () => {
    const { res } = register();
    const t = (await (await res).json()) as { accessToken: string };
    const r = await fetch(`${base}/store/me`, json({ name: 'New Name' }, authed(t.accessToken), 'PATCH'));
    expect(r.status).toBe(200);
    expect(((await r.json()) as { name: string }).name).toBe('New Name');
  });

  it('keeps customer and staff tokens apart in both directions', async () => {
    const { res } = register();
    const customer = (await (await res).json()) as { accessToken: string };
    expect((await fetch(`${base}/admin/me`, { headers: authed(customer.accessToken) })).status).toBe(401);
    const staffLogin = await fetch(`${base}/admin/auth/login`, json({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }));
    const staff = (await staffLogin.json()) as { accessToken: string };
    expect((await fetch(`${base}/admin/me`, { headers: authed(staff.accessToken) })).status).toBe(200);
    expect((await fetch(`${base}/store/me`, { headers: authed(staff.accessToken) })).status).toBe(401);
  });

  it('requires a token on /store/me', async () => {
    expect((await fetch(`${base}/store/me`)).status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest --selectProjects e2e --runInBand customer-auth`
Expected: FAIL (404 on `/store/auth/register`; every test fails).

- [ ] **Step 3: DTOs**

Create `src/customer-auth/customer-auth.dto.ts`:

```ts
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsEmail() @MaxLength(254) email: string;
  /** Kenyan mobile, e.g. 0712345678 or +254712345678 */
  @IsString() @MaxLength(20) phone: string;
  /** Length and strength are checked by the password policy for friendlier messages. */
  @IsString() @MaxLength(512) password: string;
}

export class CustomerLoginDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(1) @MaxLength(512) password: string;
}

export class CustomerRefreshDto {
  @IsString() @MinLength(20) @MaxLength(200) refreshToken: string;
}

export class UpdateMeDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}
```

- [ ] **Step 4: Service**

Create `src/customer-auth/customer-auth.service.ts`:

```ts
import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';
import { hashToken } from '../auth/auth.service';
import { TokenPair } from '../auth/models';
import { CustomerTokenPayload } from '../common/auth/auth.types';
import { DomainError } from '../common/problem-details.filter';
import { isUniqueViolation, normalizePhone } from '../common/utils';
import { APP_CONFIG, AppConfig } from '../config/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, UpdateMeDto } from './customer-auth.dto';
import { checkPassword } from './password-policy';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const ARGON = { type: argon2.argon2id, memoryCost: 65_536, timeCost: 3, parallelism: 4 } as const;
// Keeps response time similar when the email does not exist.
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$Nl8bY2oYy0E3dLgKq8gqVwq2L8V6lGQy4vNn7qQe6hE';

type Meta = { ip?: string; userAgent?: string };
type AccountWithCustomer = { id: string; email: string; customer: { id: string; name: string; phone: string } };

export interface CustomerView {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const view = (a: AccountWithCustomer): CustomerView => ({ id: a.customer.id, name: a.customer.name, email: a.email, phone: a.customer.phone });

/** Which unique constraint a P2002 error hit, as the API error code. */
function conflictCode(e: unknown): 'email_taken' | 'phone_taken' {
  const target = String((e as { meta?: { target?: unknown } }).meta?.target ?? '');
  return target.includes('email') ? 'email_taken' : 'phone_taken';
}

const CONFLICT_MESSAGE = {
  email_taken: 'An account with this email already exists',
  phone_taken: 'An account already exists for this phone number',
} as const;

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  async register(dto: RegisterDto, meta: Meta) {
    const email = dto.email.trim().toLowerCase();
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new DomainError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_phone', 'Enter a valid Kenyan mobile number');
    const weak = checkPassword(dto.password, email);
    if (weak) throw new DomainError(HttpStatus.UNPROCESSABLE_ENTITY, 'weak_password', weak);
    const passwordHash = await argon2.hash(dto.password, ARGON);
    const name = dto.name.trim();

    try {
      const account = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.customer.findUnique({ where: { phone }, include: { account: true } });
        if (existing?.account) throw new DomainError(HttpStatus.CONFLICT, 'phone_taken', CONFLICT_MESSAGE.phone_taken);
        // A guest customer with this phone (earlier anonymous orders) is claimed so they keep their history.
        const customer = existing
          ? await tx.customer.update({ where: { id: existing.id }, data: { name, email: existing.email ?? email } })
          : await tx.customer.create({ data: { phone, name, email } });
        return tx.customerAccount.create({ data: { customerId: customer.id, email, passwordHash }, include: { customer: true } });
      });
      const tokens = await this.issue(account, randomUUID(), meta);
      return { customer: view(account), tokens };
    } catch (e) {
      if (isUniqueViolation(e)) {
        const code = conflictCode(e);
        throw new DomainError(HttpStatus.CONFLICT, code, CONFLICT_MESSAGE[code]);
      }
      throw e;
    }
  }

  async login(emailRaw: string, password: string, meta: Meta) {
    const account = await this.prisma.customerAccount.findUnique({ where: { email: emailRaw.trim().toLowerCase() }, include: { customer: true } });
    if (!account) {
      await argon2.verify(DUMMY_HASH, password).catch(() => false);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (account.lockedUntil && account.lockedUntil > new Date()) throw new UnauthorizedException('Invalid email or password');
    const ok = await argon2.verify(account.passwordHash, password).catch(() => false);
    if (!ok) {
      const failed = account.failedLogins + 1;
      await this.prisma.customerAccount.update({
        where: { id: account.id },
        data: {
          failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
          lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (account.status !== 'active') throw new UnauthorizedException('Invalid email or password');
    await this.prisma.customerAccount.update({ where: { id: account.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
    const tokens = await this.issue(account, randomUUID(), meta);
    return { customer: view(account), tokens };
  }

  async refresh(raw: string, meta: Meta) {
    const row = await this.prisma.customerRefreshToken.findUnique({ where: { tokenHash: hashToken(raw) } });
    if (!row) throw new UnauthorizedException('Invalid refresh token');
    if (row.revokedAt) {
      // reuse of a rotated token: assume theft and kill the whole family
      await this.prisma.customerRefreshToken.updateMany({ where: { familyId: row.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (row.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');
    // Atomically claim the token so two parallel refreshes cannot both succeed.
    const claimed = await this.prisma.customerRefreshToken.updateMany({ where: { id: row.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (claimed.count !== 1) throw new UnauthorizedException('Refresh token already used');
    const account = await this.prisma.customerAccount.findUnique({ where: { id: row.accountId }, include: { customer: true } });
    if (!account || account.status !== 'active') throw new UnauthorizedException('Account disabled');
    const tokens = await this.issue(account, row.familyId, meta, row.id);
    return { customer: view(account), tokens };
  }

  async logout(raw: string): Promise<void> {
    const row = await this.prisma.customerRefreshToken.findUnique({ where: { tokenHash: hashToken(raw) } });
    if (!row) return;
    await this.prisma.customerRefreshToken.updateMany({ where: { familyId: row.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async me(accountId: string): Promise<CustomerView> {
    const account = await this.prisma.customerAccount.findUniqueOrThrow({ where: { id: accountId }, include: { customer: true } });
    return view(account);
  }

  async updateMe(accountId: string, dto: UpdateMeDto): Promise<CustomerView> {
    const account = await this.prisma.customerAccount.findUniqueOrThrow({ where: { id: accountId } });
    const data: { name?: string; phone?: string } = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.phone !== undefined) {
      const phone = normalizePhone(dto.phone);
      if (!phone) throw new DomainError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_phone', 'Enter a valid Kenyan mobile number');
      data.phone = phone;
    }
    try {
      await this.prisma.customer.update({ where: { id: account.customerId }, data });
    } catch (e) {
      if (isUniqueViolation(e)) throw new DomainError(HttpStatus.CONFLICT, 'phone_taken', CONFLICT_MESSAGE.phone_taken);
      throw e;
    }
    return this.me(accountId);
  }

  private async issue(account: AccountWithCustomer, familyId: string, meta: Meta, replacesId?: string): Promise<TokenPair> {
    const payload: CustomerTokenPayload = { sub: account.id, typ: 'customer', cid: account.customer.id, email: account.email, name: account.customer.name };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = new Date(Date.now() + this.cfg.refreshTtlDays * 86_400_000);
    const created = await this.prisma.customerRefreshToken.create({
      data: {
        accountId: account.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: refreshExpiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 250),
      },
    });
    if (replacesId) await this.prisma.customerRefreshToken.update({ where: { id: replacesId }, data: { replacedById: created.id } });
    return { accessToken, refreshToken, expiresIn: this.cfg.jwtAccessTtlSeconds, refreshExpiresAt };
  }
}
```

- [ ] **Step 5: Controller and module, register in the app**

Create `src/customer-auth/customer-auth.controller.ts`:

```ts
import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TokenPair } from '../auth/models';
import { CustomerAuthUser } from '../common/auth/auth.types';
import { CurrentCustomer } from '../common/auth/customer.decorators';
import { CustomerAuthGuard } from '../common/auth/customer.guard';
import { CustomerLoginDto, CustomerRefreshDto, RegisterDto, UpdateMeDto } from './customer-auth.dto';
import { CustomerAuthService, CustomerView } from './customer-auth.service';

const body = (customer: CustomerView, t: TokenPair) => ({
  customer,
  accessToken: t.accessToken,
  refreshToken: t.refreshToken,
  expiresIn: t.expiresIn,
  refreshExpiresAt: t.refreshExpiresAt,
});

const meta = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent') });

@ApiTags('store')
@Controller('store/auth')
export class CustomerAuthController {
  constructor(private readonly auth: CustomerAuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const { customer, tokens } = await this.auth.register(dto, meta(req));
    return body(customer, tokens);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: CustomerLoginDto, @Req() req: Request) {
    const { customer, tokens } = await this.auth.login(dto.email, dto.password, meta(req));
    return body(customer, tokens);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: CustomerRefreshDto, @Req() req: Request) {
    const { customer, tokens } = await this.auth.refresh(dto.refreshToken, meta(req));
    return body(customer, tokens);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: CustomerRefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }
}

@ApiTags('store')
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller('store/me')
export class StoreMeController {
  constructor(private readonly auth: CustomerAuthService) {}

  @Get()
  me(@CurrentCustomer() c: CustomerAuthUser) {
    return this.auth.me(c.accountId);
  }

  @Patch()
  update(@CurrentCustomer() c: CustomerAuthUser, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(c.accountId, dto);
  }
}
```

Create `src/customer-auth/customer-auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CustomerAuthGuard } from '../common/auth/customer.guard';
import { CustomerAuthController, StoreMeController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';

@Module({
  controllers: [CustomerAuthController, StoreMeController],
  providers: [CustomerAuthService, CustomerAuthGuard],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
```

In `src/app.module.ts` add `import { CustomerAuthModule } from './customer-auth/customer-auth.module';` and add `CustomerAuthModule,` to `imports` right after `AuthModule,`.

- [ ] **Step 6: Run to verify it passes**

Run: `npm run build`
Expected: exits 0.

Run: `npx jest --selectProjects e2e --runInBand customer-auth`
Expected: PASS (all tests). If the concurrent-registration test returns a status other than `[201, 409, 409]`, read the failing response: a 500 means a unique-violation path is not mapped (fix `conflictCode`/the transaction), not a flaky test.

- [ ] **Step 7: Commit**

```bash
git add src/customer-auth src/app.module.ts test/helpers/app.ts test/customer-auth.e2e-spec.ts
git commit -m "feat: customer accounts (register, login, refresh, logout, me)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/customer-auth src/app.module.ts test/helpers/app.ts test/customer-auth.e2e-spec.ts
```

---

## Task 4: Orders require a customer token and attach to the account

Repo: `jabali-be`.

**Files:**
- Modify: `src/orders/orders.service.ts` (`checkout` and `createOrderTx`), `src/orders/orders.dto.ts` (`CheckoutDto.customer`), `src/checkout/checkout.controller.ts`
- Test: `src/orders/orders-auth.spec.ts`, `test/customer-orders.e2e-spec.ts`

**Interfaces:**
- Consumes: `CustomerAuthGuard`, `CurrentCustomer`, `CustomerAuthUser` (Task 2).
- Produces: `OrdersService.checkout(dto, idempotencyKey, customerId): Promise<{order, created}>`; a replay of an existing key by a different customer throws `DomainError(409, 'idempotency_key_conflict', ...)`.

- [ ] **Step 1: Write the failing tests**

Create `src/orders/orders-auth.spec.ts`:

```ts
import { DomainError } from '../common/problem-details.filter';
import { OrdersService } from './orders.service';

describe('OrdersService.checkout idempotency ownership', () => {
  const existing = { id: 'o1', customerId: 'customer-A', idempotencyKey: 'key-0000001' };
  const prisma = { order: { findUnique: jest.fn().mockResolvedValue(existing) } };
  const service = new OrdersService(prisma as never, {} as never, {} as never, {} as never, {} as never);

  it('refuses to replay another customer\'s order for the same key', async () => {
    await expect(service.checkout({} as never, 'key-0000001', 'customer-B')).rejects.toMatchObject({
      constructor: DomainError,
      code: 'idempotency_key_conflict',
    });
    await expect(service.checkout({} as never, 'key-0000001', 'customer-B')).rejects.toHaveProperty('status', 409);
  });
});
```

Create `test/customer-orders.e2e-spec.ts`:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { bootApp, json } from './helpers/app';

jest.setTimeout(60_000);

describe('POST /store/orders authentication', () => {
  let app: NestExpressApplication;
  let base: string;
  beforeAll(async () => {
    ({ app, base } = await bootApp({ RATE_LIMIT_ENABLED: 'false' }));
  });
  afterAll(async () => {
    await app.close();
  });

  const key = { 'idempotency-key': 'e2e-orders-key-0001' };

  it('rejects an anonymous order with 401', async () => {
    const r = await fetch(`${base}/store/orders`, json({ lines: [] }, key));
    expect(r.status).toBe(401);
  });

  it('rejects a staff token with 401', async () => {
    const login = await fetch(`${base}/admin/auth/login`, json({ email: 'e2e-owner@jabali.test', password: 'E2e-Password-123!' }));
    const { accessToken } = (await login.json()) as { accessToken: string };
    const r = await fetch(`${base}/store/orders`, json({ lines: [] }, { ...key, authorization: `Bearer ${accessToken}` }));
    expect(r.status).toBe(401);
  });

  it('lets a customer token through the guard (an empty basket then fails validation with 400)', async () => {
    const reg = await fetch(`${base}/store/auth/register`, json({ name: 'Order Tester', email: 'order.tester@example.com', phone: '0700123456', password: 'Sunrise-over-Nairobi-42' }));
    const { accessToken } = (await reg.json()) as { accessToken: string };
    const r = await fetch(`${base}/store/orders`, json({ lines: [] }, { ...key, authorization: `Bearer ${accessToken}` }));
    expect(r.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest --selectProjects unit orders-auth && npx jest --selectProjects e2e --runInBand customer-orders`
Expected: unit FAIL (`checkout` ignores the third argument; it resolves instead of rejecting, or fails on the stub); e2e FAIL (the anonymous request is not 401).

- [ ] **Step 3: Implement**

In `src/orders/orders.dto.ts` replace `@ValidateNested() @Type(() => CheckoutCustomerDto) customer: CheckoutCustomerDto;` with:

```ts
  /** Ignored: the order always belongs to the authenticated customer. Kept optional for older clients. */
  @IsOptional() @ValidateNested() @Type(() => CheckoutCustomerDto) customer?: CheckoutCustomerDto;
```

In `src/orders/orders.service.ts` replace the beginning of `checkout` through the transaction call, and the dup-recovery branch, so the method reads:

```ts
  async checkout(dto: CheckoutDto, idempotencyKey: string, customerId: string): Promise<{ order: ReturnType<OrdersService['view']>; created: boolean }> {
    const existing = await this.prisma.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
    if (existing) return { order: this.ownedReplay(existing, customerId), created: false };

    try {
      const id = await this.prisma.$transaction(
        async (tx) => this.createOrderTx(tx, dto, customerId, idempotencyKey),
        { maxWait: 10_000, timeout: 20_000 },
      );
      void this.cache.invalidate('store:products').then(() => this.events.emit(['Product', 'Home']));
      const order = await this.prisma.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
      return { order: this.view(order), created: true };
    } catch (e) {
      if (isUniqueViolation(e)) {
        const dup = await this.prisma.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
        if (dup) return { order: this.ownedReplay(dup, customerId), created: false };
      }
      throw e;
    }
  }

  /** A replayed Idempotency-Key may only return the caller's own order. */
  private ownedReplay(order: { customerId: string } & Parameters<OrdersService['view']>[0], customerId: string) {
    if (order.customerId !== customerId) {
      throw new DomainError(HttpStatus.CONFLICT, 'idempotency_key_conflict', 'This Idempotency-Key was already used. Send a new one.');
    }
    return this.view(order);
  }
```

(Delete the removed lines that normalised `dto.customer.phone`; `normalizePhone` stays imported only if still used elsewhere in the file, otherwise remove it from the import to satisfy the compiler.)

Change the `createOrderTx` signature to `private async createOrderTx(tx: Prisma.TransactionClient, dto: CheckoutDto, customerId: string, idempotencyKey: string): Promise<string>` and replace the customer upsert block:

```ts
    const customer = await tx.customer.upsert({
      where: { phone },
      update: { name: dto.customer.name, email: dto.customer.email ?? undefined },
      create: { phone, name: dto.customer.name, email: dto.customer.email },
    });
```
with:

```ts
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
    const phone = customer.phone;
```
(Any earlier use of the removed `phone` parameter inside `createOrderTx` now reads this `phone` constant; if the compiler reports a use before the declaration, move these two lines to the top of the method body.)

In `src/checkout/checkout.controller.ts` add imports `UseGuards`, `ApiBearerAuth`, `CustomerAuthGuard` from `../common/auth/customer.guard`, `CurrentCustomer` from `../common/auth/customer.decorators`, `CustomerAuthUser` from `../common/auth/auth.types`; decorate the controller class with `@ApiBearerAuth() @UseGuards(CustomerAuthGuard)`; change the handler signature and call:

```ts
  async checkout(
    @Body() dto: CheckoutDto,
    @CurrentCustomer() customer: CustomerAuthUser,
    @Headers('idempotency-key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!key || !KEY_RE.test(key)) {
      throw new DomainError(HttpStatus.BAD_REQUEST, 'idempotency_key_required', 'Send an Idempotency-Key header (8-100 chars: letters, digits, _ - : .)');
    }
    const { order, created } = await this.orders.checkout(dto, key, customer.customerId);
```
(the rest of the method is unchanged).

- [ ] **Step 4: Run to verify they pass**

Run: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand customer-orders`
Expected: build exits 0; unit PASS; e2e PASS (3 tests). Also run `grep -rn "orders.checkout(" src test` and confirm every call passes a customer id.

- [ ] **Step 5: Commit**

```bash
git add src/orders/orders.service.ts src/orders/orders.dto.ts src/checkout/checkout.controller.ts src/orders/orders-auth.spec.ts test/customer-orders.e2e-spec.ts
git commit -m "feat: orders require a customer token and attach to the account

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/orders/orders.service.ts src/orders/orders.dto.ts src/checkout/checkout.controller.ts src/orders/orders-auth.spec.ts test/customer-orders.e2e-spec.ts
```

---

## Task 5: Storefront auth state and pure helpers

Repo: `gift-shoe-app`.

**Files:**
- Create: `src/store/authPersist.ts`, `src/store/authSlice.ts`, `src/api/authFlow.ts`, `src/lib/password.ts`
- Test: `src/store/authPersist.test.ts`, `src/store/authSlice.test.ts`, `src/api/authFlow.test.ts`, `src/lib/password.test.ts`

**Interfaces:**
- Produces (Tasks 6-7 rely on these):
  - `authPersist.ts`: `interface AuthUser { id: string; name: string; email: string; phone: string }`, `interface AuthState { user: AuthUser | null; accessToken: string | null; refreshToken: string | null }`, `AUTH_STORAGE_KEY`, `EMPTY_AUTH`, `toStored(state): string | null`, `fromStored(raw: string | null): AuthState`.
  - `authSlice.ts` (default export reducer; named actions): `sessionStarted({user, accessToken, refreshToken})`, `tokensRotated({accessToken, refreshToken})`, `userUpdated(user)`, `signedOut()`.
  - `authFlow.ts`: `AUTHED_ENDPOINTS`, `needsAuthHeader(endpoint: string | undefined): boolean`, `shouldRefresh(status: unknown, endpoint: string | undefined, hasRefreshToken: boolean): boolean`.
  - `password.ts`: `PASSWORD_MIN = 12`, `validatePassword(password: string, email: string): string | null`.

- [ ] **Step 1: Write the failing tests**

Create `src/store/authPersist.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_AUTH, fromStored, toStored } from "./authPersist.ts";

const user = { id: "c1", name: "Amina", email: "a@x.co", phone: "+254712345678" };

test("toStored never includes the access token", () => {
  const raw = toStored({ user, accessToken: "ACCESS-SECRET", refreshToken: "refresh" });
  assert.ok(raw);
  assert.ok(!raw.includes("ACCESS-SECRET"));
  assert.ok(!raw.includes("accessToken"));
});

test("toStored is null when signed out or half signed in", () => {
  assert.equal(toStored(EMPTY_AUTH), null);
  assert.equal(toStored({ user, accessToken: "a", refreshToken: null }), null);
  assert.equal(toStored({ user: null, accessToken: "a", refreshToken: "r" }), null);
});

test("fromStored restores the user and refresh token but no access token", () => {
  const raw = toStored({ user, accessToken: "a", refreshToken: "refresh" });
  assert.deepEqual(fromStored(raw), { user, accessToken: null, refreshToken: "refresh" });
});

test("fromStored treats garbage as signed out", () => {
  for (const raw of [null, "", "not json", "null", "[]", '{"user":{"id":1},"refreshToken":"r"}', '{"user":{"id":"c","name":"n","email":"e","phone":"p"}}']) {
    assert.deepEqual(fromStored(raw), EMPTY_AUTH, String(raw));
  }
});
```

Create `src/store/authSlice.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import reducer, { sessionStarted, signedOut, tokensRotated, userUpdated } from "./authSlice.ts";

const user = { id: "c1", name: "Amina", email: "a@x.co", phone: "+254712345678" };
const empty = { user: null, accessToken: null, refreshToken: null };

test("sessionStarted stores the user and both tokens", () => {
  const s = reducer(empty, sessionStarted({ user, accessToken: "a", refreshToken: "r" }));
  assert.deepEqual(s, { user, accessToken: "a", refreshToken: "r" });
});

test("tokensRotated replaces the tokens and keeps the user", () => {
  const s = reducer({ user, accessToken: "a", refreshToken: "r" }, tokensRotated({ accessToken: "a2", refreshToken: "r2" }));
  assert.deepEqual(s, { user, accessToken: "a2", refreshToken: "r2" });
});

test("userUpdated changes only the user", () => {
  const s = reducer({ user, accessToken: "a", refreshToken: "r" }, userUpdated({ ...user, name: "New" }));
  assert.equal(s.user?.name, "New");
  assert.equal(s.refreshToken, "r");
});

test("signedOut clears everything", () => {
  assert.deepEqual(reducer({ user, accessToken: "a", refreshToken: "r" }, signedOut()), empty);
});
```

Create `src/api/authFlow.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { needsAuthHeader, shouldRefresh } from "./authFlow.ts";

test("only authenticated endpoints get an Authorization header", () => {
  assert.equal(needsAuthHeader("getMe"), true);
  assert.equal(needsAuthHeader("updateMe"), true);
  assert.equal(needsAuthHeader("getProducts"), false);
  assert.equal(needsAuthHeader("login"), false);
  assert.equal(needsAuthHeader(undefined), false);
});

test("a 401 on an authenticated endpoint with a refresh token triggers one refresh", () => {
  assert.equal(shouldRefresh(401, "getMe", true), true);
});

test("no refresh for other statuses, public endpoints, auth endpoints or without a refresh token", () => {
  assert.equal(shouldRefresh(500, "getMe", true), false);
  assert.equal(shouldRefresh(401, "getProducts", true), false);
  assert.equal(shouldRefresh(401, "login", true), false);
  assert.equal(shouldRefresh(401, "getMe", false), false);
  assert.equal(shouldRefresh(undefined, "getMe", true), false);
});
```

Create `src/lib/password.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePassword } from "./password.ts";

test("accepts a long passphrase", () => {
  assert.equal(validatePassword("correct horse battery staple", "a@x.co"), null);
});

test("rejects short, over-long, repeated and email-derived passwords", () => {
  assert.match(validatePassword("short", "a@x.co") ?? "", /at least 12/);
  assert.match(validatePassword("x1".repeat(100), "a@x.co") ?? "", /at most 128/);
  assert.match(validatePassword("z".repeat(14), "a@x.co") ?? "", /too easy/);
  assert.match(validatePassword("Amina.Said@Example.com", "amina.said@example.com") ?? "", /email/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for the four new modules.

- [ ] **Step 3: Implement**

Create `src/store/authPersist.ts`:

```ts
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export const AUTH_STORAGE_KEY = "jabali-customer-auth";
export const EMPTY_AUTH: AuthState = { user: null, accessToken: null, refreshToken: null };

/** Only the user and the refresh token are persisted. The access token lives in memory so injected script cannot read it from storage. */
export function toStored(s: AuthState): string | null {
  if (!s.user || !s.refreshToken) return null;
  return JSON.stringify({ user: s.user, refreshToken: s.refreshToken });
}

const isUser = (v: unknown): v is AuthUser => {
  const u = v as Record<string, unknown> | null;
  return !!u && ["id", "name", "email", "phone"].every((k) => typeof u[k] === "string");
};

/** Restores a persisted session. Anything malformed means signed out. */
export function fromStored(raw: string | null): AuthState {
  try {
    const data = JSON.parse(raw ?? "") as { user?: unknown; refreshToken?: unknown } | null;
    if (data && isUser(data.user) && typeof data.refreshToken === "string" && data.refreshToken) {
      return { user: data.user, accessToken: null, refreshToken: data.refreshToken };
    }
  } catch {
    /* fall through */
  }
  return EMPTY_AUTH;
}
```

Create `src/store/authSlice.ts`:

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AUTH_STORAGE_KEY, EMPTY_AUTH, fromStored, type AuthState, type AuthUser } from "./authPersist.ts";

function initial(): AuthState {
  try {
    return typeof localStorage === "undefined" ? EMPTY_AUTH : fromStored(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return EMPTY_AUTH; // storage can be blocked
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: initial(),
  reducers: {
    sessionStarted(_s, a: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>) {
      return { user: a.payload.user, accessToken: a.payload.accessToken, refreshToken: a.payload.refreshToken };
    },
    tokensRotated(s, a: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      s.accessToken = a.payload.accessToken;
      s.refreshToken = a.payload.refreshToken;
    },
    userUpdated(s, a: PayloadAction<AuthUser>) {
      s.user = a.payload;
    },
    signedOut() {
      return EMPTY_AUTH;
    },
  },
});

export const { sessionStarted, tokensRotated, userUpdated, signedOut } = authSlice.actions;
export default authSlice.reducer;
```

Create `src/api/authFlow.ts`:

```ts
/** Endpoints that need the customer's access token. Public catalogue calls never carry it. */
export const AUTHED_ENDPOINTS: ReadonlySet<string> = new Set(["getMe", "updateMe"]);

export const needsAuthHeader = (endpoint: string | undefined): boolean => endpoint !== undefined && AUTHED_ENDPOINTS.has(endpoint);

/** Refresh once when an authenticated call is rejected and we hold a refresh token. */
export const shouldRefresh = (status: unknown, endpoint: string | undefined, hasRefreshToken: boolean): boolean =>
  status === 401 && hasRefreshToken && needsAuthHeader(endpoint);
```

Create `src/lib/password.ts`:

```ts
export const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

/** Client-side mirror of the server's password rules (the server also checks a common-password list). */
export function validatePassword(password: string, email: string): string | null {
  const length = [...password].length;
  if (length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (/^(.)\1+$/u.test(password)) return "That password is too easy to guess.";
  const mail = email.trim().toLowerCase();
  const local = mail.split("@")[0] ?? "";
  const lower = password.toLowerCase();
  if (lower === mail || (local.length >= 6 && lower.includes(local))) return "Do not use your email in your password.";
  return null;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS (all earlier tests plus the new ones).

- [ ] **Step 5: Commit**

```bash
git add src/store/authPersist.ts src/store/authPersist.test.ts src/store/authSlice.ts src/store/authSlice.test.ts src/api/authFlow.ts src/api/authFlow.test.ts src/lib/password.ts src/lib/password.test.ts
git commit -m "feat: storefront auth state, persistence rules and refresh decision helpers

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/store/authPersist.ts src/store/authPersist.test.ts src/store/authSlice.ts src/store/authSlice.test.ts src/api/authFlow.ts src/api/authFlow.test.ts src/lib/password.ts src/lib/password.test.ts
```

---

## Task 6: Storefront auth API layer

Repo: `gift-shoe-app`.

**Files:**
- Modify: `src/api/tags.ts`, `src/api/baseApi.ts`, `src/store/index.ts`, `src/store/hooks.ts`
- Create: `src/api/auth.ts`

**Interfaces:**
- Consumes: Task 5 (`sessionStarted`, `tokensRotated`, `userUpdated`, `signedOut`, `AuthState`, `AuthUser`, `needsAuthHeader`, `shouldRefresh`, `AUTH_STORAGE_KEY`, `toStored`).
- Produces (Task 7 relies on these): hooks `useRegisterMutation`, `useLoginMutation`, `useLogoutMutation`, `useGetMeQuery`, `useUpdateMeMutation` from `src/api/auth.ts`; `useAppSelector` from `src/store/hooks.ts`; the store now has an `auth` slice persisted to `localStorage`; `"Me"` is a new tag.

- [ ] **Step 1: Tags, store, hooks**

In `src/api/tags.ts` change `TAGS` to include `"Me"`:

```ts
export const TAGS = ["Home", "Product", "Category", "Content", "Settings", "Delivery", "Testimonial", "Me"] as const;
```

Replace `src/store/index.ts`:

```ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/api/baseApi";
import auth from "./authSlice";
import { AUTH_STORAGE_KEY, toStored } from "./authPersist";

export const store = configureStore({
  reducer: { auth, [baseApi.reducerPath]: baseApi.reducer },
  middleware: (gdm) => gdm().concat(baseApi.middleware),
});

// Persist the session (never the access token) whenever it changes.
let lastStored: string | null = toStored(store.getState().auth);
store.subscribe(() => {
  const next = toStored(store.getState().auth);
  if (next === lastStored) return;
  lastStored = next;
  try {
    if (next) localStorage.setItem(AUTH_STORAGE_KEY, next);
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

Replace `src/store/hooks.ts`:

```ts
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

- [ ] **Step 2: baseApi with an authenticated base query**

Replace the top of `src/api/baseApi.ts` (imports, `API_URL`, and the `baseApi` definition) with:

```ts
import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { needsAuthHeader, shouldRefresh } from "./authFlow";
import { TAGS } from "./tags";
import { signedOut, tokensRotated, userUpdated } from "@/store/authSlice";
import type { AuthState, AuthUser } from "@/store/authPersist";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api/v1";

const authOf = (api: { getState: () => unknown }): AuthState => (api.getState() as { auth: AuthState }).auth;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/store`,
  // The Authorization header goes only to authenticated endpoints, so public GETs stay simple cross-origin requests.
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = (getState() as { auth: AuthState }).auth.accessToken;
    if (token && needsAuthHeader(endpoint)) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

let refreshing: Promise<boolean> | null = null;

/** On a 401 from an authenticated call, rotate the refresh token once and retry; a failed refresh signs the customer out. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  const refreshToken = authOf(api).refreshToken;
  if (result.error && shouldRefresh(result.error.status, api.endpoint, !!refreshToken)) {
    refreshing ??= (async () => {
      const r = await rawBaseQuery({ url: "/auth/refresh", method: "POST", body: { refreshToken } }, api, extra);
      if (r.data) {
        const d = r.data as { accessToken: string; refreshToken: string; customer: AuthUser };
        api.dispatch(tokensRotated({ accessToken: d.accessToken, refreshToken: d.refreshToken }));
        api.dispatch(userUpdated(d.customer));
        return true;
      }
      api.dispatch(signedOut());
      return false;
    })().finally(() => {
      refreshing = null;
    });
    if (await refreshing) result = await rawBaseQuery(args, api, extra);
  }
  return result;
};

/** Public storefront API. Content endpoints are injected per domain, like the dashboard. */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: TAGS,
  endpoints: () => ({}),
});
```
(Keep the existing `errorMessage` and `isNotFound` helpers below unchanged.)

- [ ] **Step 3: Auth endpoints**

Create `src/api/auth.ts`:

```ts
import type { AuthUser } from "@/store/authPersist";
import { sessionStarted, signedOut, userUpdated } from "@/store/authSlice";
import { baseApi } from "./baseApi";

export interface AuthResponse {
  customer: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation<AuthResponse, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionStarted({ user: data.customer, accessToken: data.accessToken, refreshToken: data.refreshToken }));
        } catch {
          /* the error is shown by the form */
        }
      },
    }),
    login: b.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionStarted({ user: data.customer, accessToken: data.accessToken, refreshToken: data.refreshToken }));
        } catch {
          /* the error is shown by the form */
        }
      },
    }),
    /** Argument: the refresh token to revoke. Signs out locally even if the request fails. */
    logout: b.mutation<void, string>({
      query: (refreshToken) => ({ url: "/auth/logout", method: "POST", body: { refreshToken } }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          /* still sign out */
        }
        dispatch(signedOut());
        dispatch(baseApi.util.resetApiState());
      },
    }),
    getMe: b.query<AuthUser, void>({
      query: () => "/me",
      providesTags: ["Me"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userUpdated(data));
        } catch {
          /* a failed refresh already signed the customer out */
        }
      },
    }),
    updateMe: b.mutation<AuthUser, { name?: string; phone?: string }>({
      query: (body) => ({ url: "/me", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation, useGetMeQuery, useUpdateMeMutation } = authApi;
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no output (exit 0). If `api.endpoint` or the `prepareHeaders` argument types differ in the installed RTK version, adjust the types only (keep behaviour) and note it in the ledger.

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/tags.ts src/api/baseApi.ts src/api/auth.ts src/store/index.ts src/store/hooks.ts
git commit -m "feat: storefront auth endpoints with token refresh and persisted session

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/api/tags.ts src/api/baseApi.ts src/api/auth.ts src/store/index.ts src/store/hooks.ts
```

---

## Task 7: Checkout gate, account page, header control, prefilled checkout

Repo: `gift-shoe-app`.

**Files:**
- Create: `src/features/auth/AuthPanel.tsx`, `src/features/auth/RequireCustomer.tsx`, `src/features/auth/AccountPage.tsx`
- Modify: `src/config/routes.ts`, `src/app/App.tsx`, `src/components/layout/Header.tsx`, `src/features/checkout/CheckoutPage.tsx`

**Interfaces:**
- Consumes: Task 6 hooks and `useAppSelector`; `Field` (`src/components/ui/Field.tsx`); `normalizePhone` (`src/lib/phone.ts`); `validatePassword` (Task 5); `errorMessage` (`src/api/baseApi.ts`); `ErrorState`.
- Produces: `<AuthPanel onDone? />`, `<RequireCustomer>{children}</RequireCustomer>`, route `ROUTES.account = "/account"`.

- [ ] **Step 1: AuthPanel**

Create `src/features/auth/AuthPanel.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { errorMessage } from "@/api/baseApi";
import { useLoginMutation, useRegisterMutation } from "@/api/auth";
import { Field } from "@/components/ui/Field";
import { normalizePhone } from "@/lib/phone";
import { validatePassword } from "@/lib/password";

type Mode = "signin" | "signup";
type Errors = Record<string, string>;

interface AuthPanelProps {
  title?: string;
  onDone?: () => void;
}

/** Sign in or create an account. On success the session is stored by the API layer and `onDone` runs. */
export function AuthPanel({ title = "Sign in to continue", onDone }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [login, { isLoading: signingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const busy = signingIn || registering;

  const validate = (): Errors => {
    const e: Errors = {};
    if (mode === "signup" && name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email.";
    if (mode === "signup") {
      if (!normalizePhone(phone)) e.phone = "Enter a valid Kenyan number, like 0712 345 678.";
      const bad = validatePassword(password, email);
      if (bad) e.password = bad;
    } else if (!password) e.password = "Enter your password.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      if (mode === "signin") await login({ email: email.trim(), password }).unwrap();
      else await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password }).unwrap();
      setPassword("");
      onDone?.();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const tab = (m: Mode, label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErrors({}); setFormError(""); }} className={`min-h-11 flex-1 border-b-2 px-4 text-sm font-semibold transition ${mode === m ? "border-ink" : "border-transparent text-muted hover:text-ink"}`}>
      {label}
    </button>
  );

  return (
    <section aria-labelledby="auth-title" className="mx-auto max-w-md px-4 py-16 md:py-24">
      <h1 id="auth-title" className="display text-4xl md:text-5xl">{title}</h1>
      <p className="mt-3 text-muted">You need an account to check out. It takes a minute.</p>
      <div role="tablist" aria-label="Account" className="mt-8 flex border-b border-line">
        {tab("signin", "Sign in")}
        {tab("signup", "Create account")}
      </div>
      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        {mode === "signup" && (
          <Field label="Full name" htmlFor="auth-name" error={errors.name}>
            <input id="auth-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label="Email" htmlFor="auth-email" error={errors.email}>
          <input id="auth-email" type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {mode === "signup" && (
          <Field label="Phone" htmlFor="auth-phone" error={errors.phone} hint="Used for delivery and M-Pesa.">
            <input id="auth-phone" type="tel" className="field" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        )}
        <Field label="Password" htmlFor="auth-password" error={errors.password} hint={mode === "signup" ? "At least 12 characters. A short phrase works well." : undefined}>
          <input id="auth-password" type="password" className="field" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {formError && (
          <p role="alert" className="flex items-center gap-1 text-sm text-danger">
            <WarningCircle size={16} /> {formError}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-accent h-14 w-full text-base disabled:opacity-60">
          {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: RequireCustomer and AccountPage**

Create `src/features/auth/RequireCustomer.tsx`:

```tsx
import type { ReactNode } from "react";
import { useGetMeQuery } from "@/api/auth";
import { AuthPanel } from "@/features/auth/AuthPanel";
import { useAppSelector } from "@/store/hooks";

/**
 * Shows `children` only to a signed-in customer; everyone else gets the sign-in panel in place.
 * The stored session is validated once with `/store/me`, so a revoked session returns to the panel.
 * The bag lives in its own store and is untouched by signing in or out.
 */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const signedIn = useAppSelector((s) => !!s.auth.user && !!s.auth.refreshToken);
  const me = useGetMeQuery(undefined, { skip: !signedIn });

  if (!signedIn) return <AuthPanel />;
  if (me.isLoading) return <div className="min-h-[60dvh]" aria-busy="true" />;
  return <>{children}</>;
}
```

Create `src/features/auth/AccountPage.tsx`:

```tsx
import { useLogoutMutation } from "@/api/auth";
import { useAppSelector } from "@/store/hooks";

export default function AccountPage() {
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [logout, { isLoading }] = useLogoutMutation();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 md:py-24">
      <h1 className="display text-4xl md:text-5xl">Your account</h1>
      <dl className="mt-8 divide-y divide-line border-y border-line">
        {([["Name", user.name], ["Email", user.email], ["Phone", user.phone]] as const).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-4">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <button className="btn-dark mt-8" disabled={isLoading} onClick={() => void logout(refreshToken ?? "")}>
        Sign out
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Routes, header, checkout prefill**

In `src/config/routes.ts` add `account: "/account",` to `ROUTES` (after `order`).

In `src/app/App.tsx`: add `import { RequireCustomer } from "@/features/auth/RequireCustomer";` and `const AccountPage = lazy(() => import("@/features/auth/AccountPage"));`, replace the checkout route with `<Route path={ROUTES.checkout} element={<RequireCustomer><CheckoutPage /></RequireCustomer>} />` and add `<Route path={ROUTES.account} element={<RequireCustomer><AccountPage /></RequireCustomer>} />` before the `notFound` route.

In `src/components/layout/Header.tsx`: add `User` to the `@phosphor-icons/react` import, add `import { useAppSelector } from "@/store/hooks";`, read `const customer = useAppSelector((s) => s.auth.user);` inside `Header`, and insert before the bag button:

```tsx
          <Link to="/account" className="grid size-11 place-items-center hover:bg-ink/5" aria-label={customer ? `Your account, ${customer.name}` : "Sign in"}>
            <User size={22} weight={customer ? "fill" : "regular"} />
          </Link>
```

In `src/features/checkout/CheckoutPage.tsx`: add `import { useAppSelector } from "@/store/hooks";`, read `const account = useAppSelector((s) => s.auth.user);` at the top of the component, and replace `useState<ContactForm>(EMPTY_CONTACT)` with:

```tsx
  const [form, setForm] = useState<ContactForm>(() => ({
    ...EMPTY_CONTACT,
    name: account?.name ?? "",
    phone: account?.phone ?? "",
    email: account?.email ?? "",
  }));
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

Run: `npm test`
Expected: PASS.

Run: `npx vite build --outDir "$TEMP/gsa-dist" --emptyOutDir`
Expected: `built in ...` with no errors.

- [ ] **Step 5: Manual check against the running servers (read-only except creating one test account)**

The dev database must have the Task 2 migration applied first: `cd jabali-be && npm run migrate:deploy` (this changes the developer's dev database; do it only with their go-ahead, otherwise run this step against a test database). With the backend and storefront running:
- [ ] Signed out, visit `/checkout`: the sign-in panel shows, even with an empty bag.
- [ ] Create an account with a weak password: the form shows the rule; with a valid one you land on checkout with name, phone and email prefilled.
- [ ] Add an item to the bag, sign out from `/account`, return to `/checkout`: panel shows, the bag still has the item.
- [ ] Sign in with a wrong password: one generic error message; five wrong attempts, then the right password: still refused (locked).
- [ ] In dev tools, edit the stored `accessToken`-less session's refresh token to garbage, reload `/checkout`: the panel returns (session rejected).

- [ ] **Step 6: Commit**

```bash
git add src/features/auth src/config/routes.ts src/app/App.tsx src/components/layout/Header.tsx src/features/checkout/CheckoutPage.tsx
git commit -m "feat: checkout sign-in gate, account page and prefilled checkout

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/features/auth src/config/routes.ts src/app/App.tsx src/components/layout/Header.tsx src/features/checkout/CheckoutPage.tsx
```

---

# Part B: Security hardening

## Task 8: Backend dependency vulnerabilities

Repo: `jabali-be`.

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Record the baseline**

Run: `npm audit --omit=dev --audit-level=high 2>&1 | tail -30`
Expected: reports the 5 vulnerabilities (3 high, 2 moderate), traced to `@nestjs/swagger` and `js-yaml`. Save the package names and advisory titles for the ledger.

- [ ] **Step 2: Apply the non-breaking fix**

Run: `npm audit fix --omit=dev` then `npm audit --omit=dev --audit-level=high 2>&1 | tail -15`
If high findings remain, read which package needs which version (`npm audit` prints the fixed range), then upgrade only that package (`npm install <pkg>@<fixed-range>`), keeping the major version unless the advisory requires otherwise. If the only fix is a breaking major upgrade of `@nestjs/swagger`, read its release notes and apply it, then continue to Step 3 to prove nothing broke.

- [ ] **Step 3: Prove nothing broke**

Run: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand`
Expected: build exits 0; unit PASS; e2e PASS (store-events, customer-auth, customer-orders).

Run: `npm audit --omit=dev --audit-level=high`
Expected: exits 0. Moderate findings with no available fix may remain: list each (package, advisory, why no fix) in the ledger and in the control matrix (Task 13).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: fix production dependency vulnerabilities

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- package.json package-lock.json
```

---

## Task 9: Backend config validation, explicit headers, uploads sandbox, body limit

Repo: `jabali-be`.

**Files:**
- Modify: `src/config/config.ts`, `src/setup.ts`
- Test: `src/config/config.spec.ts`, `test/hardening.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `config.ts`: `AppConfig` gains `trustProxyHops: number` and `rateLimitEnabled: boolean`; exported `assertCorsOrigins(origins: string[], nodeEnv: AppConfig['nodeEnv']): void`; `loadConfig` throws in production for a wildcard or non-`https:` origin, and when `RATE_LIMIT_ENABLED=false`.
  - `setup.ts`: exported `helmetOptions(cfg: Pick<AppConfig, 'nodeEnv'>)` returning helmet options; Swagger only when `nodeEnv !== 'production'`.

- [ ] **Step 1: Write the failing tests**

Create `src/config/config.spec.ts`:

```ts
import { assertCorsOrigins, loadConfig } from './config';

const base = { DATABASE_URL: 'postgresql://x', JWT_ACCESS_SECRET: 'x'.repeat(40) };

describe('assertCorsOrigins', () => {
  it('allows http localhost origins outside production', () => {
    expect(() => assertCorsOrigins(['http://localhost:5173'], 'development')).not.toThrow();
  });
  it('rejects a wildcard in any environment', () => {
    expect(() => assertCorsOrigins(['*'], 'development')).toThrow(/wildcard/i);
  });
  it('requires https origins in production', () => {
    expect(() => assertCorsOrigins(['http://shop.example.com'], 'production')).toThrow(/https/);
    expect(() => assertCorsOrigins(['https://shop.example.com'], 'production')).not.toThrow();
  });
});

describe('loadConfig hardening', () => {
  it('defaults to one trusted proxy hop and rate limiting on', () => {
    const cfg = loadConfig({ ...base });
    expect(cfg.trustProxyHops).toBe(1);
    expect(cfg.rateLimitEnabled).toBe(true);
  });
  it('rejects disabling rate limiting in production', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://a.example.com', RATE_LIMIT_ENABLED: 'false' })).toThrow(/RATE_LIMIT_ENABLED/);
  });
  it('rejects insecure CORS origins in production', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'http://a.example.com' })).toThrow(/https/);
  });
  it('accepts a valid production configuration', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://a.example.com' })).not.toThrow();
  });
});
```

Create `src/setup.spec.ts`:

```ts
import { helmetOptions } from './setup';

describe('helmetOptions', () => {
  it('sends a locked-down API CSP in production', () => {
    const opts = helmetOptions({ nodeEnv: 'production' });
    expect(opts.contentSecurityPolicy).toMatchObject({ directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } });
  });
  it('turns the CSP off in development so Swagger UI works', () => {
    expect(helmetOptions({ nodeEnv: 'development' }).contentSecurityPolicy).toBe(false);
  });
  it('always sets HSTS for a year and a no-referrer policy', () => {
    const opts = helmetOptions({ nodeEnv: 'test' });
    expect(opts.strictTransportSecurity).toMatchObject({ maxAge: 31_536_000, includeSubDomains: true });
    expect(opts.referrerPolicy).toEqual({ policy: 'no-referrer' });
  });
});
```

Create `test/hardening.e2e-spec.ts`:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../src/config/config';
import { bootApp, json } from './helpers/app';

jest.setTimeout(60_000);

describe('response hardening', () => {
  let app: NestExpressApplication;
  let base: string;
  beforeAll(async () => {
    ({ app, base } = await bootApp({ RATE_LIMIT_ENABLED: 'false' }));
  });
  afterAll(async () => {
    await app.close();
  });

  it('sets the security headers and hides the framework', async () => {
    const r = await fetch(`${base}/store/delivery/zones`);
    expect(r.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(r.headers.get('x-content-type-options')).toBe('nosniff');
    expect(r.headers.get('referrer-policy')).toBe('no-referrer');
    expect(r.headers.get('x-powered-by')).toBeNull();
  });

  it('rejects a body over 100 kB with 413', async () => {
    const r = await fetch(`${base}/store/auth/login`, json({ email: 'a@b.co', password: 'x'.repeat(200_000) }));
    expect(r.status).toBe(413);
  });

  it('serves uploads with nosniff and a sandbox CSP', async () => {
    const dir = resolve(loadConfig().uploadDir);
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, 'e2e-hardening.txt');
    writeFileSync(file, 'hello');
    try {
      const r = await fetch(`${base.replace('/api/v1', '')}/uploads/e2e-hardening.txt`);
      expect(r.status).toBe(200);
      expect(r.headers.get('x-content-type-options')).toBe('nosniff');
      expect(r.headers.get('content-security-policy')).toBe('sandbox');
    } finally {
      rmSync(file, { force: true });
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest --selectProjects unit config.spec setup.spec && npx jest --selectProjects e2e --runInBand hardening`
Expected: FAIL (`assertCorsOrigins`/`helmetOptions` not exported; 413 and sandbox assertions fail).

- [ ] **Step 3: Config**

In `src/config/config.ts`:
- Add to `envSchema`: `TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),` and `RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),`.
- Add to the `AppConfig` type: `trustProxyHops: number; rateLimitEnabled: boolean;`.
- Add above `loadConfig`:

```ts
/** Wildcards are never allowed (credentials are enabled); production origins must be https. */
export function assertCorsOrigins(origins: string[], nodeEnv: AppConfig['nodeEnv']): void {
  for (const o of origins) {
    if (o === '*' || o.includes('*')) throw new Error('CORS_ORIGINS must not contain a wildcard');
    if (nodeEnv === 'production' && !o.startsWith('https://')) throw new Error(`CORS_ORIGINS must use https in production (got ${o})`);
  }
}
```
- In `loadConfig`, after `const e = parsed.data;` add:

```ts
  assertCorsOrigins(e.CORS_ORIGINS, e.NODE_ENV);
  if (e.NODE_ENV === 'production' && !e.RATE_LIMIT_ENABLED) throw new Error('RATE_LIMIT_ENABLED=false is not allowed in production');
```
and add `trustProxyHops: e.TRUST_PROXY_HOPS, rateLimitEnabled: e.RATE_LIMIT_ENABLED,` to the returned object.

(The `Invalid environment configuration: ...` wrapper only covers schema errors; the two `throw new Error` lines above surface their own messages, which is what the tests match.)

- [ ] **Step 4: Setup**

In `src/setup.ts` add the exported builder above `configureApp` and use it:

```ts
import type { HelmetOptions } from 'helmet';

/** Helmet settings. The API only serves JSON, so production gets a CSP that allows nothing. */
export function helmetOptions(cfg: Pick<AppConfig, 'nodeEnv'>): HelmetOptions {
  return {
    // Development keeps the default (no CSP) so Swagger UI can load its assets.
    contentSecurityPolicy: cfg.nodeEnv === 'production' ? { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } } : false,
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true },
    referrerPolicy: { policy: 'no-referrer' },
    // images from /uploads are embedded by the storefront and dashboard on other origins
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  };
}
```

In `configureApp` replace `app.set('trust proxy', 1);` with `app.set('trust proxy', cfg.trustProxyHops);`, replace the `helmet({...})` call with `app.use(helmet(helmetOptions(cfg)));`, add `app.useBodyParser('json', { limit: '100kb' });` before `app.useGlobalPipes(`, replace the `useStaticAssets` call with:

```ts
  app.useStaticAssets(resolve(cfg.uploadDir), {
    prefix: '/uploads',
    maxAge: '7d',
    // Uploaded files must never be able to run script in the API origin.
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', 'sandbox');
    },
  });
```
and change `if (opts.swagger) {` to `if (opts.swagger && cfg.nodeEnv !== 'production') {`.

- [ ] **Step 5: Run to verify they pass**

Run: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand`
Expected: build exits 0; unit PASS (including `config.spec`, `setup.spec`); all e2e PASS. If the 413 test returns a different status, check that `useBodyParser` runs before the global pipes and that the request reaches body-parser (the limit is enforced there).

- [ ] **Step 6: Commit**

```bash
git add src/config/config.ts src/config/config.spec.ts src/setup.ts src/setup.spec.ts test/hardening.e2e-spec.ts
git commit -m "feat: config validation, explicit helmet, upload sandbox and body limit

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/config/config.ts src/config/config.spec.ts src/setup.ts src/setup.spec.ts test/hardening.e2e-spec.ts
```

---

## Task 10: Rate limiting and SSE connection cap

Repo: `jabali-be`.

**Files:**
- Create: `src/common/rate-limit/rate-limiter.ts`, `src/common/rate-limit/rate-limit.guard.ts`, `src/common/rate-limit/rate-limit.module.ts`
- Modify: `src/app.module.ts`, `src/customer-auth/customer-auth.controller.ts`, `src/store-events/store-events.controller.ts`
- Test: `src/common/rate-limit/rate-limiter.spec.ts`, `test/rate-limit.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `RateLimiter` with `hit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSec: number }` and `ConnectionCounter` with `acquire(key: string, max: number): (() => void) | null` (returns a release function, or `null` when over the cap).
  - Decorator `RateLimit(...rules: RateRule[])` where `RateRule = { name: string; limit: number; windowMs: number; by: 'ip' | 'email' }`; a global `RateLimitGuard` applies a default rule (`default`, 120/min, by ip) plus any route rules; exceeding one throws `DomainError(429, 'rate_limited', ...)` with a `Retry-After` header.

- [ ] **Step 1: Write the failing tests**

Create `src/common/rate-limit/rate-limiter.spec.ts`:

```ts
import { ConnectionCounter, RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('allows up to the limit then blocks with a retry delay', () => {
    let now = 1_000;
    const rl = new RateLimiter(() => now);
    expect(rl.hit('k', 2, 60_000)).toEqual({ allowed: true, retryAfterSec: 0 });
    expect(rl.hit('k', 2, 60_000).allowed).toBe(true);
    const blocked = rl.hit('k', 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(60);
    now += 30_000;
    expect(rl.hit('k', 2, 60_000).retryAfterSec).toBe(30);
  });

  it('starts a fresh window after it expires', () => {
    let now = 0;
    const rl = new RateLimiter(() => now);
    rl.hit('k', 1, 1_000);
    expect(rl.hit('k', 1, 1_000).allowed).toBe(false);
    now = 1_001;
    expect(rl.hit('k', 1, 1_000).allowed).toBe(true);
  });

  it('keeps keys independent', () => {
    const rl = new RateLimiter(() => 0);
    rl.hit('a', 1, 1_000);
    expect(rl.hit('a', 1, 1_000).allowed).toBe(false);
    expect(rl.hit('b', 1, 1_000).allowed).toBe(true);
  });

  it('forgets expired keys so memory does not grow without bound', () => {
    let now = 0;
    const rl = new RateLimiter(() => now);
    for (let i = 0; i < 5; i++) rl.hit(`k${i}`, 1, 1_000);
    now = 10_000;
    rl.sweep();
    expect(rl.size).toBe(0);
  });
});

describe('ConnectionCounter', () => {
  it('caps concurrent connections per key and frees a slot on release', () => {
    const cc = new ConnectionCounter();
    const a = cc.acquire('ip', 2);
    const b = cc.acquire('ip', 2);
    expect(a && b).toBeTruthy();
    expect(cc.acquire('ip', 2)).toBeNull();
    a?.();
    expect(cc.acquire('ip', 2)).not.toBeNull();
  });

  it('release is idempotent', () => {
    const cc = new ConnectionCounter();
    const a = cc.acquire('ip', 1);
    a?.();
    a?.();
    expect(cc.acquire('ip', 1)).not.toBeNull();
    expect(cc.acquire('ip', 1)).toBeNull();
  });
});
```

Create `test/rate-limit.e2e-spec.ts`:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { bootApp, json } from './helpers/app';

jest.setTimeout(120_000);

describe('rate limiting', () => {
  let app: NestExpressApplication;
  let base: string;
  beforeAll(async () => {
    ({ app, base } = await bootApp({ RATE_LIMIT_ENABLED: 'true' }));
  });
  afterAll(async () => {
    await app.close();
  });

  it('limits login to 5 per minute per email', async () => {
    const attempt = () => fetch(`${base}/store/auth/login`, json({ email: 'victim@example.com', password: 'wrong-password-123' }));
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    const sixth = await attempt();
    expect(sixth.status).toBe(429);
    expect(Number(sixth.headers.get('retry-after'))).toBeGreaterThan(0);
    const body = (await sixth.json()) as { code?: string };
    expect(body.code).toBe('rate_limited');
  });

  it('limits login to 10 per minute per IP across different emails', async () => {
    let limited = 0;
    for (let i = 0; i < 12; i++) {
      const r = await fetch(`${base}/store/auth/login`, json({ email: `user${i}@example.com`, password: 'wrong-password-123' }));
      if (r.status === 429) limited++;
    }
    expect(limited).toBeGreaterThan(0);
  });

  it('caps concurrent event streams at 5 per IP', async () => {
    const ctrls: AbortController[] = [];
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const c = new AbortController();
      ctrls.push(c);
      const r = await fetch(`${base}/store/events`, { signal: c.signal });
      statuses.push(r.status);
    }
    ctrls.forEach((c) => c.abort());
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest --selectProjects unit rate-limiter`
Expected: FAIL (`Cannot find module './rate-limiter'`).

- [ ] **Step 3: Limiter, counter, guard, module**

Create `src/common/rate-limit/rate-limiter.ts`:

```ts
/** Fixed-window counter keyed by an arbitrary string. In-process: one API instance only. */
export class RateLimiter {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();
  private hits = 0;

  constructor(private readonly now: () => number = Date.now) {}

  get size(): number {
    return this.windows.size;
  }

  hit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
    const t = this.now();
    if (++this.hits % 500 === 0) this.sweep();
    let w = this.windows.get(key);
    if (!w || w.resetAt <= t) {
      w = { count: 0, resetAt: t + windowMs };
      this.windows.set(key, w);
    }
    w.count += 1;
    if (w.count <= limit) return { allowed: true, retryAfterSec: 0 };
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((w.resetAt - t) / 1000)) };
  }

  /** Drops expired windows. */
  sweep(): void {
    const t = this.now();
    for (const [k, w] of this.windows) if (w.resetAt <= t) this.windows.delete(k);
  }
}

/** Caps concurrent long-lived connections (e.g. SSE) per key. */
export class ConnectionCounter {
  private readonly open = new Map<string, number>();

  /** A release function, or null when `max` connections are already open for the key. */
  acquire(key: string, max: number): (() => void) | null {
    const n = this.open.get(key) ?? 0;
    if (n >= max) return null;
    this.open.set(key, n + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const left = (this.open.get(key) ?? 1) - 1;
      if (left <= 0) this.open.delete(key);
      else this.open.set(key, left);
    };
  }
}
```

Create `src/common/rate-limit/rate-limit.guard.ts`:

```ts
import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { APP_CONFIG, AppConfig } from '../../config/config';
import { DomainError } from '../problem-details.filter';
import { RateLimiter } from './rate-limiter';

export interface RateRule {
  name: string;
  limit: number;
  windowMs: number;
  by: 'ip' | 'email';
}

const RATE_RULES = 'rate_rules';
const MINUTE = 60_000;

export const DEFAULT_RULE: RateRule = { name: 'default', limit: 120, windowMs: MINUTE, by: 'ip' };

/** Extra limits for one route, on top of the global per-IP default. */
export const RateLimit = (...rules: RateRule[]) => SetMetadata(RATE_RULES, rules);

export const perMinute = (name: string, limit: number, by: 'ip' | 'email'): RateRule => ({ name, limit, windowMs: MINUTE, by });

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limiter = new RateLimiter();

  constructor(
    private readonly reflector: Reflector,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (!this.cfg.rateLimitEnabled) return true;
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const rules = [DEFAULT_RULE, ...(this.reflector.getAllAndOverride<RateRule[]>(RATE_RULES, [ctx.getHandler(), ctx.getClass()]) ?? [])];
    for (const rule of rules) {
      const subject = rule.by === 'ip' ? (req.ip ?? 'unknown') : emailOf(req);
      if (!subject) continue;
      // The route path is part of the key so one route's traffic cannot use up another route's allowance.
      const key = `${rule.name}:${rule.by}:${rule.name === 'default' ? '' : (req.route as { path?: string } | undefined)?.path ?? ''}:${subject}`;
      const r = this.limiter.hit(key, rule.limit, rule.windowMs);
      if (!r.allowed) {
        res.setHeader('Retry-After', String(r.retryAfterSec));
        throw new DomainError(HttpStatus.TOO_MANY_REQUESTS, 'rate_limited', 'Too many requests. Please wait and try again.');
      }
    }
    return true;
  }
}

function emailOf(req: Request): string | null {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string' && email.length <= 254 ? email.trim().toLowerCase() : null;
}
```

Create `src/common/rate-limit/rate-limit.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

@Global()
@Module({ providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }] })
export class RateLimitModule {}
```

In `src/app.module.ts` add `import { RateLimitModule } from './common/rate-limit/rate-limit.module';` and `RateLimitModule,` right after `StoreEventsModule,`.

- [ ] **Step 4: Apply route limits and the stream cap**

In `src/customer-auth/customer-auth.controller.ts` add `import { perMinute, RateLimit } from '../common/rate-limit/rate-limit.guard';` and decorate:
- `register`: `@RateLimit(perMinute('register', 5, 'ip'))`
- `login`: `@RateLimit(perMinute('login', 10, 'ip'), perMinute('login-email', 5, 'email'))`
- `refresh`: `@RateLimit(perMinute('refresh', 30, 'ip'))`

Replace the body of `StoreEventsController` in `src/store-events/store-events.controller.ts` with the capped version:

```ts
import { Controller, Header, HttpStatus, MessageEvent, Req, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { defer, finalize, interval, map, merge, Observable } from 'rxjs';
import { ConnectionCounter } from '../common/rate-limit/rate-limiter';
import { DomainError } from '../common/problem-details.filter';
import { StoreEventsService } from './store-events.service';

export const HEARTBEAT_MS = 25_000;
export const MAX_STREAMS_PER_IP = 5;

@ApiTags('store')
@Controller('store')
export class StoreEventsController {
  private readonly streams = new ConnectionCounter();

  constructor(private readonly events: StoreEventsService) {}

  /**
   * Server-sent events. `invalidate` carries `{ tags }` for the storefront to refetch;
   * `ping` is a heartbeat so proxies keep the connection open. Each IP may hold a few streams at a time.
   */
  @Sse('events')
  @Header('X-Accel-Buffering', 'no')
  stream(@Req() req: Request): Observable<MessageEvent> {
    const release = this.streams.acquire(req.ip ?? 'unknown', MAX_STREAMS_PER_IP);
    if (!release) throw new DomainError(HttpStatus.TOO_MANY_REQUESTS, 'too_many_streams', 'Too many open connections');
    const changes = this.events.events$.pipe(
      map((e): MessageEvent => ({ type: 'invalidate', id: String(e.at), data: { tags: e.tags } })),
    );
    const beat = interval(HEARTBEAT_MS).pipe(map((): MessageEvent => ({ type: 'ping', data: '' })));
    return defer(() => merge(changes, beat)).pipe(finalize(release));
  }
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `npm run build && npx jest --selectProjects unit rate-limiter && npx jest --selectProjects e2e --runInBand`
Expected: build exits 0; unit PASS (6 tests); all e2e PASS, including `rate-limit` (the earlier e2e files run with `RATE_LIMIT_ENABLED=false`, the store-events file with the default; if the store-events test now returns 429, give its `bootApp` call `{ RATE_LIMIT_ENABLED: 'false' }`).

- [ ] **Step 6: Commit**

```bash
git add src/common/rate-limit src/app.module.ts src/customer-auth/customer-auth.controller.ts src/store-events/store-events.controller.ts test/rate-limit.e2e-spec.ts test/store-events.e2e-spec.ts
git commit -m "feat: rate limiting and per-IP cap on live event streams

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/common/rate-limit src/app.module.ts src/customer-auth/customer-auth.controller.ts src/store-events/store-events.controller.ts test/rate-limit.e2e-spec.ts test/store-events.e2e-spec.ts
```

---

## Task 11: Security event logging

Repo: `jabali-be`.

**Files:**
- Create: `src/common/security-log/security-log.service.ts`, `src/common/security-log/security-log.module.ts`
- Modify: `src/app.module.ts`, `src/customer-auth/customer-auth.service.ts`, `src/common/auth/guards.ts`, `src/common/auth/customer.guard.ts`, `src/common/rate-limit/rate-limit.guard.ts`
- Test: `src/common/security-log/security-log.spec.ts`

**Interfaces:**
- Produces: `maskEmail(email: string): string`, `sanitizeFields(fields: Record<string, unknown>): Record<string, unknown>`, `SecurityLogService.log(event: SecurityEvent, fields?: Record<string, unknown>): void` (writes one JSON line via Nest `Logger('security')`; `SecurityEvent` is a union of `'register' | 'login_success' | 'login_failed' | 'account_locked' | 'refresh_reuse' | 'token_type_rejected' | 'rate_limited'`).

- [ ] **Step 1: Write the failing test**

Create `src/common/security-log/security-log.spec.ts`:

```ts
import { Logger } from '@nestjs/common';
import { maskEmail, sanitizeFields, SecurityLogService } from './security-log.service';

describe('maskEmail', () => {
  it('keeps the first character and the domain', () => {
    expect(maskEmail('amina.said@example.com')).toBe('a***@example.com');
  });
  it('handles odd input without throwing', () => {
    expect(maskEmail('nope')).toBe('***');
    expect(maskEmail('')).toBe('***');
    expect(maskEmail('@x.co')).toBe('***@x.co');
  });
});

describe('sanitizeFields', () => {
  it('drops secrets and masks emails', () => {
    const out = sanitizeFields({ email: 'amina@example.com', password: 'hunter2', refreshToken: 'r', accessToken: 'a', token: 't', secret: 's', ip: '1.2.3.4', accountId: 'x' });
    expect(out).toEqual({ email: 'a***@example.com', ip: '1.2.3.4', accountId: 'x' });
  });
  it('truncates very long strings', () => {
    const out = sanitizeFields({ userAgent: 'u'.repeat(1000) }) as { userAgent: string };
    expect(out.userAgent.length).toBeLessThanOrEqual(201);
  });
});

describe('SecurityLogService', () => {
  it('writes one structured JSON line per event', () => {
    const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    new SecurityLogService().log('login_failed', { email: 'amina@example.com', ip: '1.2.3.4', password: 'nope' });
    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(spy.mock.calls[0][0])) as Record<string, unknown>;
    expect(line).toMatchObject({ event: 'login_failed', email: 'a***@example.com', ip: '1.2.3.4' });
    expect(line.password).toBeUndefined();
    expect(typeof line.at).toBe('string');
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest --selectProjects unit security-log`
Expected: FAIL (`Cannot find module './security-log.service'`).

- [ ] **Step 3: Implement the service and module**

Create `src/common/security-log/security-log.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';

export type SecurityEvent = 'register' | 'login_success' | 'login_failed' | 'account_locked' | 'refresh_reuse' | 'token_type_rejected' | 'rate_limited';

const SECRET_KEY = /password|token|secret|authorization|cookie/i;

/** `amina.said@example.com` -> `a***@example.com`. */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return '***';
  const local = email.slice(0, at);
  return `${local ? `${local[0]}***` : '***'}${email.slice(at)}`;
}

/** Removes secrets, masks emails and truncates long strings before anything reaches the log. */
export function sanitizeFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SECRET_KEY.test(k)) continue;
    if (typeof v === 'string') out[k] = /email/i.test(k) ? maskEmail(v) : v.slice(0, 200) + (v.length > 200 ? '…' : '');
    else out[k] = v;
  }
  return out;
}

/** Structured JSON log lines for security-relevant events (ASVS 7.1, ISO 27001 A.8.15). */
@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger('security');

  log(event: SecurityEvent, fields: Record<string, unknown> = {}): void {
    this.logger.log(JSON.stringify({ event, at: new Date().toISOString(), ...sanitizeFields(fields) }));
  }
}
```

Create `src/common/security-log/security-log.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { SecurityLogService } from './security-log.service';

@Global()
@Module({ providers: [SecurityLogService], exports: [SecurityLogService] })
export class SecurityLogModule {}
```

In `src/app.module.ts` import it and add `SecurityLogModule,` after `RateLimitModule,`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest --selectProjects unit security-log`
Expected: PASS (5 tests).

- [ ] **Step 5: Emit the events**

- `src/customer-auth/customer-auth.service.ts`: inject `private readonly security: SecurityLogService` (add to the constructor after `prisma`, `jwt`; import from `../common/security-log/security-log.service`). Log:
  - after a successful `register`: `this.security.log('register', { accountId: account.id, email, ip: meta.ip })`
  - in `login` for an unknown email: `this.security.log('login_failed', { email: emailRaw, ip: meta.ip, reason: 'unknown_email' })`; for a wrong password: `reason: 'bad_password'` with `accountId`; on the failure that triggers the lock additionally `this.security.log('account_locked', { accountId: account.id, ip: meta.ip })`; while locked: `reason: 'locked'`; on success: `this.security.log('login_success', { accountId: account.id, ip: meta.ip })`.
  - in `refresh` when a revoked token is reused: `this.security.log('refresh_reuse', { accountId: row.accountId, ip: meta.ip })`.
- `src/common/auth/customer.guard.ts` and `src/common/auth/guards.ts` (`JwtAuthGuard`): inject `SecurityLogService` and log `token_type_rejected` (with `ip: req.ip`) where the type check rejects a token. Update the two spec files from Task 2 to pass `{ log: jest.fn() } as never` as the extra constructor argument.
- `src/common/rate-limit/rate-limit.guard.ts`: inject `SecurityLogService` and log `rate_limited` (rule name, `ip: req.ip`) just before throwing.

- [ ] **Step 6: Verify everything still passes**

Run: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand`
Expected: build exits 0; unit and e2e PASS. In the e2e output, `security` log lines appear as JSON and contain no password, token or full email.

- [ ] **Step 7: Commit**

```bash
git add src/common/security-log src/app.module.ts src/customer-auth/customer-auth.service.ts src/common/auth/guards.ts src/common/auth/customer.guard.ts src/common/auth/guards.spec.ts src/common/rate-limit/rate-limit.guard.ts
git commit -m "feat: structured security event logging

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/common/security-log src/app.module.ts src/customer-auth/customer-auth.service.ts src/common/auth/guards.ts src/common/auth/customer.guard.ts src/common/auth/guards.spec.ts src/common/rate-limit/rate-limit.guard.ts
```

---

## Task 12: Storefront headers, CSP, safe image URLs and source guards

Repo: `gift-shoe-app`.

**Files:**
- Create: `scripts/headers.mjs`, `scripts/write-headers.mjs`, `scripts/env-check.mjs`, `src/security/source-scan.test.ts`
- Modify: `package.json` (scripts), `src/lib/media.ts`, `src/components/ui/Photo.tsx`
- Test: `scripts/headers.test.mjs`, `scripts/env-check.test.mjs`, `src/lib/media.test.ts` (extend)

**Interfaces:**
- Produces:
  - `scripts/headers.mjs`: `scriptHash(body: string): string`, `inlineScripts(html: string): string[]`, `buildCsp({apiOrigin, scriptHashes, strict}): string`, `buildHeadersFile({apiOrigin, scriptHashes, strict}): string`, `apiOriginOf(url: string, strict: boolean): string` (throws for non-https in strict mode).
  - `scripts/env-check.mjs`: `forbiddenEnvNames(env: Record<string, string | undefined>): string[]`.
  - `src/lib/media.ts`: `safeImageUrl(url: string): string | null`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/headers.test.mjs`:

```js
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
  for (const h of ["Content-Security-Policy:", "Strict-Transport-Security: max-age=31536000; includeSubDomains", "X-Content-Type-Options: nosniff", "Referrer-Policy: strict-origin-when-cross-origin", "Permissions-Policy:", "Cross-Origin-Opener-Policy: same-origin"]) {
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
```

Create `scripts/env-check.test.mjs`:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { forbiddenEnvNames } from "./env-check.mjs";

test("flags VITE_ variables that look like secrets", () => {
  const env = { VITE_API_URL: "https://x", VITE_STRIPE_SECRET_KEY: "s", VITE_DB_PASSWORD: "p", VITE_PRIVATE_KEY: "k", OTHER_SECRET: "fine, not exposed to the client" };
  assert.deepEqual(forbiddenEnvNames(env).sort(), ["VITE_DB_PASSWORD", "VITE_PRIVATE_KEY", "VITE_STRIPE_SECRET_KEY"]);
});

test("passes a clean environment", () => {
  assert.deepEqual(forbiddenEnvNames({ VITE_API_URL: "https://x" }), []);
});
```

Append to `src/lib/media.test.ts` (add `safeImageUrl` to the import from `./media.ts`):

```ts
test("safeImageUrl allows https and rejects script and data URLs", () => {
  assert.equal(safeImageUrl("https://images.unsplash.com/photo-1"), "https://images.unsplash.com/photo-1");
  assert.equal(safeImageUrl("javascript:alert(1)"), null);
  assert.equal(safeImageUrl("data:image/svg+xml;base64,AAAA"), null);
  assert.equal(safeImageUrl("//evil.example/x.png"), null);
  assert.equal(safeImageUrl("not a url"), null);
  assert.equal(safeImageUrl(""), null);
});

test("safeImageUrl allows plain http only for localhost (development)", () => {
  assert.equal(safeImageUrl("http://localhost:5000/uploads/a.jpg"), "http://localhost:5000/uploads/a.jpg");
  assert.equal(safeImageUrl("http://evil.example/a.jpg"), null);
});
```

Create `src/security/source-scan.test.ts`:

```ts
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const FORBIDDEN: [RegExp, string][] = [
  [/dangerouslySetInnerHTML/, "dangerouslySetInnerHTML"],
  [/\.innerHTML\s*=/, "innerHTML assignment"],
  [/\beval\s*\(/, "eval()"],
  [/new\s+Function\s*\(/, "new Function()"],
  [/document\.write\s*\(/, "document.write()"],
];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : [];
  });
}

test("the storefront source avoids APIs that execute or inject untrusted strings", () => {
  const offenders: string[] = [];
  for (const file of sources(join(process.cwd(), "src"))) {
    const text = readFileSync(file, "utf8");
    for (const [re, label] of FORBIDDEN) if (re.test(text)) offenders.push(`${file}: ${label}`);
  }
  assert.deepEqual(offenders, []);
});

test("tokens and personal data are not written to the console", () => {
  const offenders: string[] = [];
  for (const file of sources(join(process.cwd(), "src"))) {
    const text = readFileSync(file, "utf8");
    if (/console\.(log|info|debug)\([^)]*(token|password|email|phone)/i.test(text)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
```

- [ ] **Step 2: Update the test script and run to verify failure**

In `package.json` change the `test` script to `node --test \"src/**/*.test.ts\" \"scripts/*.test.mjs\"`.

Run: `npm test`
Expected: FAIL (`headers.mjs`, `env-check.mjs` missing; `safeImageUrl` not exported).

- [ ] **Step 3: Implement the scripts**

Create `scripts/headers.mjs`:

```js
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
    ["font-src", "'self'"],
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
```

Create `scripts/env-check.mjs`:

```js
/** VITE_* variables are baked into the public bundle: names that look like secrets must never be set. */
export function forbiddenEnvNames(env) {
  return Object.keys(env).filter((k) => k.startsWith("VITE_") && /SECRET|PASSWORD|PRIVATE/i.test(k));
}
```

Create `scripts/write-headers.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { forbiddenEnvNames } from "./env-check.mjs";
import { apiOriginOf, buildHeadersFile, inlineScripts, scriptHash } from "./headers.mjs";

const bad = forbiddenEnvNames(process.env);
if (bad.length) {
  console.error(`Refusing to build: these VITE_ variables look like secrets and would be public: ${bad.join(", ")}`);
  process.exit(1);
}

const strict = process.env.CONTEXT === "production" || process.env.STRICT_HEADERS === "1";
const apiUrl = process.env.VITE_API_URL ?? "http://localhost:5000/api/v1";
const dist = join(process.cwd(), "dist");

try {
  const apiOrigin = apiOriginOf(apiUrl, strict);
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const hashes = inlineScripts(html).map(scriptHash);
  writeFileSync(join(dist, "_headers"), buildHeadersFile({ apiOrigin, scriptHashes: hashes, strict }));
  console.log(`dist/_headers written (API ${apiOrigin}, ${hashes.length} inline script hash(es), ${strict ? "strict" : "relaxed"})`);
  if (!strict) console.warn("Not a production build: upgrade-insecure-requests is omitted and a non-https API origin is allowed.");
} catch (e) {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
}
```

In `package.json` set `"build": "tsc --noEmit && vite build && node scripts/write-headers.mjs"` and add `"audit": "npm audit --omit=dev --audit-level=high"` to `scripts`.

- [ ] **Step 4: Safe image URLs**

Append to `src/lib/media.ts`:

```ts
/** Image URLs come from the CMS (free-form JSON). Only https is allowed, plus http on localhost for development. */
export function safeImageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return url;
    if (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return url;
    return null;
  } catch {
    return null;
  }
}
```

In `src/components/ui/Photo.tsx` import `safeImageUrl` with `sized`/`srcSetFor` and change the render line to:

```tsx
      {src && safeImageUrl(src) ? <PhotoImage key={src} src={src} alt={alt} w={w} eager={eager} position={position} /> : null}
```

- [ ] **Step 5: Run to verify it passes, then prove the build**

Run: `npm test`
Expected: PASS (all earlier tests plus headers, env-check, media and source-scan tests).

Run: `npx tsc --noEmit`
Expected: no output.

Run: `npx vite build --outDir "$TEMP/gsa-dist" --emptyOutDir` then `cd` is unchanged; run the header script against that output: `node -e "process.chdir(process.cwd()); " ` is not needed, instead run: `DIST_CHECK=1 node scripts/write-headers.mjs` only works against `dist/`, so for the temp build run the same logic through the tests above and finish with the real check in Step 6.

- [ ] **Step 6: Real build check without touching the tracked `dist/`**

Run: `STRICT_HEADERS=1 VITE_API_URL=https://api.example.com/api/v1 npx vite build --outDir "$TEMP/gsa-dist" --emptyOutDir` and then, to exercise the script against that output, run it with the dist directory overridden: add support in `scripts/write-headers.mjs` by changing `const dist = join(process.cwd(), "dist");` to `const dist = process.env.DIST_DIR ?? join(process.cwd(), "dist");`, then run `DIST_DIR="$TEMP/gsa-dist" STRICT_HEADERS=1 VITE_API_URL=https://api.example.com/api/v1 node scripts/write-headers.mjs`.
Expected: prints `dist/_headers written (API https://api.example.com, 1 inline script hash(es), strict)`. Read `$TEMP/gsa-dist/_headers` and confirm the `script-src` contains exactly one `'sha256-...'` and that the hash equals the SHA-256 of the inline theme script in `$TEMP/gsa-dist/index.html` (compute it with `node -e` from the script body to confirm, since a mismatch would block the theme script and flash the wrong theme).
Run: `STRICT_HEADERS=1 VITE_API_URL=http://insecure.example.com/api node scripts/write-headers.mjs`
Expected: exits 1 with "must use https".

- [ ] **Step 7: Commit**

```bash
git add scripts package.json src/lib/media.ts src/lib/media.test.ts src/components/ui/Photo.tsx src/security
git commit -m "feat: strict CSP and security headers at build time, safe image URLs, source guards

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- scripts package.json src/lib/media.ts src/lib/media.test.ts src/components/ui/Photo.tsx src/security
```

---

## Task 13: Control matrix and final verification

Repo: `jabali-be` (matrix) and both repos (verification).

**Files:**
- Create: `jabali-be/docs/security/CONTROL-MATRIX.md`

- [ ] **Step 1: Write the control matrix**

Create `docs/security/CONTROL-MATRIX.md` in `jabali-be`:

```md
# Security control matrix

Scope: the Jabali storefront (`gift-shoe-app`) and the public `/store/*` API with customer authentication (`jabali-be`).
Method: OWASP ASVS 4.0 Level 2 requirements, mapped to ISO/IEC 27001:2022 Annex A controls.
Statuses: **Implemented** (in code, with a test or check), **Partial** (some of it), **Organisational gap** (needs people, process or a supplier, not code).

This document does not claim ISO certification or compliance. ISO 27001 certifies an organisation's management system; the "Organisational gap" rows are what remains for that.

| # | Control | ASVS 4.0 | ISO 27001:2022 | Where | Verification | Status |
|---|---|---|---|---|---|---|
| 1 | Passwords: 12 to 128 characters, common-password list, no email in password | 2.1.1, 2.1.2, 2.1.7 | A.5.17, A.8.5 | `jabali-be/src/customer-auth/password-policy.ts`, `gift-shoe-app/src/lib/password.ts` | `password-policy.spec.ts`, `password.test.ts` | Implemented |
| 2 | Password storage: argon2id (64 MiB, t=3, p=4) | 2.4.1 | A.8.24 | `customer-auth.service.ts` | `customer-auth.e2e-spec.ts` | Implemented |
| 3 | Generic login errors, equalised timing, account lockout (5 failures, 15 min) | 2.2.1, 2.2.3 | A.8.5 | `customer-auth.service.ts` | e2e: generic error, lockout | Implemented |
| 4 | Rate limiting on login (10/min/IP, 5/min/email), register, refresh; global 120/min/IP | 2.2.1, 11.1.4 | A.8.20, A.8.6 | `src/common/rate-limit/*` | `rate-limiter.spec.ts`, `rate-limit.e2e-spec.ts` | Implemented (single instance) |
| 5 | Session tokens: short-lived access JWT, rotating refresh tokens, reuse detection revokes the family, logout revokes | 3.3.1, 3.5.1, 3.5.2 | A.8.5 | `customer-auth.service.ts` | e2e: rotation and reuse | Implemented |
| 6 | Customer and staff tokens cannot be used for each other's routes | 4.1.1, 4.1.3 | A.5.15, A.8.3 | `guards.ts`, `customer.guard.ts` | `guards.spec.ts`, e2e isolation test | Implemented |
| 7 | Orders require an authenticated customer; idempotency keys cannot replay another customer's order | 4.2.1, 4.1.1 | A.8.3 | `orders.service.ts`, `checkout.controller.ts` | `orders-auth.spec.ts`, `customer-orders.e2e-spec.ts` | Implemented |
| 8 | Input validation: DTO whitelist and forbid-unknown, body size 100 kB | 5.1.3, 13.2.6 | A.8.28 | `setup.ts`, DTOs | `hardening.e2e-spec.ts` (413) | Implemented |
| 9 | SQL injection: Prisma parameterised queries; raw queries only as tagged templates | 5.3.4, 5.3.5 | A.8.28 | `src/**` | Code review of raw queries (no `$queryRawUnsafe` with input) | Implemented |
| 10 | Output encoding and no DOM injection sinks in the storefront | 5.3.3, 5.3.6 | A.8.28 | `gift-shoe-app/src` | `source-scan.test.ts` | Implemented |
| 11 | Untrusted CMS image URLs restricted to https (http only on localhost) | 5.1.5, 12.5.2 | A.8.28 | `src/lib/media.ts`, `Photo.tsx` | `media.test.ts` | Implemented |
| 12 | Content-Security-Policy without unsafe-eval or script unsafe-inline (hash for the one inline script) | 14.4.3, 14.4.7 | A.8.9, A.8.26 | `scripts/headers.mjs`, `write-headers.mjs` | `headers.test.mjs`, build check | Partial: `style-src` keeps `'unsafe-inline'` |
| 13 | Transport and browser security headers (HSTS, nosniff, referrer, permissions, COOP, frame-ancestors) | 14.4.1-14.4.6, 9.1.1 | A.8.20, A.8.21 | `headers.mjs`, `src/setup.ts` | `headers.test.mjs`, `setup.spec.ts`, `hardening.e2e-spec.ts` | Implemented (host must honour `_headers`) |
| 14 | API responses: no framework banner; production CSP `default-src 'none'`; Swagger off in production | 14.3.2, 14.4.1 | A.8.9 | `src/setup.ts` | `setup.spec.ts`, e2e headers | Implemented |
| 15 | Uploaded files cannot run script in the API origin (sandbox CSP, nosniff) | 12.5.1, 12.4.1 | A.8.12 | `src/setup.ts` | `hardening.e2e-spec.ts` | Implemented |
| 16 | CORS allow-list; wildcard and non-https origins rejected in production | 14.5.3 | A.8.20 | `src/config/config.ts` | `config.spec.ts` | Implemented |
| 17 | Config safety: JWT secret 32+ characters, rate limiting cannot be disabled in production, secrets not in `VITE_*` | 14.1.3, 6.4.1 | A.8.9, A.5.17 | `config.ts`, `env-check.mjs` | `config.spec.ts`, `env-check.test.mjs` | Implemented |
| 18 | Security event logging with secret redaction and masked emails | 7.1.1, 7.1.2, 7.2.1 | A.8.15 | `src/common/security-log/*` | `security-log.spec.ts` | Implemented |
| 19 | Admin writes audited (existing) | 7.2.1 | A.8.15 | `audit.interceptor.ts` | existing | Implemented |
| 20 | Vulnerable dependencies: `npm audit --omit=dev --audit-level=high` passes in both repos | 14.2.1 | A.8.8 | `package.json` scripts | Task 8 and `npm run audit` | Implemented (record remaining moderates below) |
| 21 | Error handling: RFC 7807 problem responses, no stack traces, generic client errors | 7.4.1 | A.8.28 | `problem-details.filter.ts`, `ErrorState.tsx` | existing | Implemented |
| 22 | Client token handling: access token in memory only, refresh token in `localStorage` | 3.2.3, 8.2.1 | A.8.24 | `src/store/authPersist.ts` | `authPersist.test.ts` | Partial: refresh token readable by injected script (mitigated by CSP) |
| 23 | Email verification, password reset | 2.1.x, 2.5.x | A.5.17 | not built (no mail provider) | n/a | Organisational gap |
| 24 | Phone ownership verification (guest-account claim by phone) | 2.7.x | A.5.16 | not built (no SMS provider) | n/a | Organisational gap |
| 25 | Customer MFA | 2.8.x | A.8.5 | not built | n/a | Organisational gap |
| 26 | ISMS scope, security policies, roles and responsibilities | n/a | A.5.1, A.5.2, A.5.4 | n/a | n/a | Organisational gap |
| 27 | Risk assessment and treatment plan | n/a | clause 6.1 | n/a | n/a | Organisational gap |
| 28 | Supplier security (hosting, Safaricom, Unsplash) | n/a | A.5.19, A.5.21 | n/a | n/a | Organisational gap |
| 29 | Incident response plan and breach notification | n/a | A.5.24, A.5.26 | n/a | n/a | Organisational gap |
| 30 | Backups, restore testing, business continuity | n/a | A.8.13, A.5.30 | n/a | n/a | Organisational gap |
| 31 | Independent penetration test | n/a | A.8.29 | n/a | n/a | Organisational gap |
| 32 | Edge WAF and DDoS protection; shared rate-limit store for multiple API instances | n/a | A.8.20, A.8.6 | n/a | n/a | Organisational gap |
| 33 | Secrets manager and rotation; central log shipping, alerting and retention | n/a | A.8.15, A.8.16, A.5.17 | n/a | n/a | Organisational gap |

## Remaining dependency advisories

Fill in from Task 8: any moderate advisory that has no available fix (package, advisory, why it is not exploitable here), or "none".
```

Replace the last section's placeholder line with the real result of Task 8 (package names and advisories, or "none").

- [ ] **Step 2: Final verification**

Run in `jabali-be`: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand && npm audit --omit=dev --audit-level=high`
Expected: build exits 0; unit PASS; e2e PASS (store-events, customer-auth, customer-orders, hardening, rate-limit); audit exits 0.

Run in `gift-shoe-app`: `npm test && npx tsc --noEmit && npm run audit`
Expected: tests PASS; no tsc output; audit exits 0.

Run the header proof from Task 12 Step 6 once more against a fresh temp build.

- [ ] **Step 3: Commit**

```bash
git add docs/security/CONTROL-MATRIX.md
git commit -m "docs: security control matrix mapped to ASVS and ISO 27001

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- docs/security/CONTROL-MATRIX.md
```

# Part C: Transactional email

## Task 14: Mail core (config, transport, MailService)

Repo: `jabali-be`.

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/config/config.ts`, `src/config/config.spec.ts`, `src/app.module.ts`, `test/helpers/app.ts`
- Create: `src/mail/mail.service.ts`, `src/mail/mail.module.ts`, `test/helpers/smtp.ts`
- Test: `src/mail/mail.service.spec.ts`, `test/mail.e2e-spec.ts`

**Interfaces:**
- Consumes: `maskEmail` (Task 11), `APP_CONFIG`/`AppConfig`.
- Produces (Tasks 15-16 rely on these exact names):
  - `AppConfig.mail: { smtpUrl?: string; from: string; replyTo?: string; storeUrl: string }` (`storeUrl` without a trailing slash).
  - `MailMessage { to: string; subject: string; html: string; text: string }`, `MailTransport`, `MAIL_TRANSPORT`, `LogTransport` (with `outbox: OutgoingMail[]`).
  - `MailService.send(msg): Promise<boolean>` (never throws; `true` once the SMTP server accepted it), `MailService.queue(msg): void` (fire and forget), public mutable `retryDelaysMs: number[]` (default `[0, 2000, 10000]`).
  - Test helper `startSmtp(): Promise<TestSmtp>` with `url`, `messages`, `waitFor(count, timeoutMs?)`, `close()`.

- [ ] **Step 1: Install dependencies**

Run: `npm install nodemailer && npm install -D @types/nodemailer smtp-server @types/smtp-server mailparser @types/mailparser`
Expected: installs without peer errors; `package.json` lists `nodemailer` under dependencies and the other four under devDependencies.

- [ ] **Step 2: Write the failing tests**

Append to `src/config/config.spec.ts` inside a new `describe('mail config', ...)`, and change the existing "accepts a valid production configuration" test to include `SMTP_URL: 'smtp://mail.example.com:587'` in its env:

```ts
describe('mail config', () => {
  const prod = { ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://a.example.com', STORE_URL: 'https://shop.example.com', SMTP_URL: 'smtp://mail.example.com:587' };

  it('has safe development defaults and no SMTP', () => {
    const cfg = loadConfig({ ...base });
    expect(cfg.mail.smtpUrl).toBeUndefined();
    expect(cfg.mail.from).toBe('Jabali <no-reply@jabali.co.ke>');
    expect(cfg.mail.storeUrl).toBe('http://localhost:5173');
  });
  it('strips a trailing slash from STORE_URL', () => {
    expect(loadConfig({ ...base, STORE_URL: 'https://shop.example.com/' }).mail.storeUrl).toBe('https://shop.example.com');
  });
  it('requires SMTP_URL in production', () => {
    const { SMTP_URL: _omit, ...noSmtp } = prod;
    expect(() => loadConfig(noSmtp)).toThrow(/SMTP_URL is required in production/);
    expect(() => loadConfig(prod)).not.toThrow();
  });
  it('requires an https STORE_URL in production', () => {
    expect(() => loadConfig({ ...prod, STORE_URL: 'http://shop.example.com' })).toThrow(/STORE_URL must use https/);
  });
  it('rejects a malformed SMTP_URL and a MAIL_FROM with line breaks', () => {
    expect(() => loadConfig({ ...base, SMTP_URL: 'http://not-smtp' })).toThrow(/SMTP_URL/);
    expect(() => loadConfig({ ...base, MAIL_FROM: 'Jabali <a@b.co>\r\nBcc: x@y.z' })).toThrow(/MAIL_FROM/);
  });
  it('treats an empty SMTP_URL as unset', () => {
    expect(loadConfig({ ...base, SMTP_URL: '' }).mail.smtpUrl).toBeUndefined();
  });
});
```

Create `src/mail/mail.service.spec.ts`:

```ts
import { Logger } from '@nestjs/common';
import type { AppConfig } from '../config/config';
import { MailService, MailTransport } from './mail.service';

const cfg = { nodeEnv: 'test', mail: { from: 'Jabali <no-reply@jabali.co.ke>', replyTo: 'help@jabali.co.ke', storeUrl: 'https://shop.example.com' } } as unknown as AppConfig;
const msg = { to: 'amina@example.com', subject: 'Hello', html: '<p>Hi</p>', text: 'Hi' };

function make(transport: MailTransport): MailService {
  const s = new MailService(transport, cfg);
  s.retryDelaysMs = [0, 0, 0];
  return s;
}

describe('MailService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('sends once with the configured From and Reply-To', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'id1' });
    expect(await make({ sendMail }).send(msg)).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toMatchObject({ from: cfg.mail.from, replyTo: 'help@jabali.co.ke', to: msg.to, subject: 'Hello', html: msg.html, text: msg.text });
  });

  it('retries and succeeds on the third attempt', async () => {
    const sendMail = jest.fn().mockRejectedValueOnce(new Error('down')).mockRejectedValueOnce(new Error('down')).mockResolvedValue({ messageId: 'id' });
    expect(await make({ sendMail }).send(msg)).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(3);
  });

  it('gives up after three failures without throwing', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('down'));
    await expect(make({ sendMail }).send(msg)).resolves.toBe(false);
    expect(sendMail).toHaveBeenCalledTimes(3);
  });

  it('skips an invalid recipient without calling the transport', async () => {
    const sendMail = jest.fn();
    for (const to of ['', 'nope', 'a@b', 'a b@c.co', 'a@b.co,c@d.co', 'a@b.co\r\nBcc: x@y.z']) {
      expect(await make({ sendMail }).send({ ...msg, to })).toBe(false);
    }
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('strips line breaks from the subject so it cannot inject headers', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    await make({ sendMail }).send({ ...msg, subject: 'Order\r\nBcc: evil@example.com' });
    expect(sendMail.mock.calls[0][0].subject).toBe('Order Bcc: evil@example.com');
  });

  it('queue never throws and never blocks, even when the transport fails', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('down'));
    expect(() => make({ sendMail }).queue(msg)).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
    expect(sendMail).toHaveBeenCalled();
  });

  it('does not log the message body or the full address', async () => {
    const log = jest.spyOn(Logger.prototype, 'log');
    await make({ sendMail: jest.fn().mockResolvedValue({ messageId: 'id' }) }).send({ ...msg, html: '<p>SECRET-BODY</p>', text: 'SECRET-BODY' });
    const logged = log.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).not.toContain('SECRET-BODY');
    expect(logged).not.toContain('amina@example.com');
    expect(logged).toContain('a***@example.com');
  });
});
```

Create `test/helpers/smtp.ts`:

```ts
import { AddressInfo } from 'node:net';
import { ParsedMail, simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';

export interface TestSmtp {
  url: string;
  messages: ParsedMail[];
  waitFor(count: number, timeoutMs?: number): Promise<ParsedMail[]>;
  close(): Promise<void>;
}

/** A real SMTP server on a random local port that parses whatever it receives. Used to prove mail actually goes over the wire. */
export async function startSmtp(): Promise<TestSmtp> {
  const messages: ParsedMail[] = [];
  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS', 'AUTH'],
    logger: false,
    onData(stream, _session, done) {
      simpleParser(stream).then(
        (m) => {
          messages.push(m);
          done();
        },
        (e: Error) => done(e),
      );
    },
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const port = (server.server.address() as AddressInfo).port;
  return {
    url: `smtp://127.0.0.1:${port}`,
    messages,
    async waitFor(count, timeoutMs = 5000) {
      const end = Date.now() + timeoutMs;
      while (messages.length < count) {
        if (Date.now() > end) throw new Error(`expected ${count} message(s), received ${messages.length}`);
        await new Promise((r) => setTimeout(r, 50));
      }
      return messages;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
```

Create `test/mail.e2e-spec.ts`:

```ts
import * as nodemailer from 'nodemailer';
import { loadConfig } from '../src/config/config';
import { MailService, MailTransport } from '../src/mail/mail.service';
import { startSmtp, TestSmtp } from './helpers/smtp';

jest.setTimeout(30_000);

const env = { DATABASE_URL: 'postgresql://x', JWT_ACCESS_SECRET: 'x'.repeat(40) };

describe('SMTP delivery', () => {
  let smtp: TestSmtp;
  beforeAll(async () => {
    smtp = await startSmtp();
  });
  afterAll(async () => {
    await smtp.close();
  });

  it('delivers a multipart message over a real SMTP connection', async () => {
    const cfg = loadConfig({ ...env, SMTP_URL: smtp.url, MAIL_FROM: 'Jabali <orders@jabali.test>', MAIL_REPLY_TO: 'help@jabali.test' });
    const mail = new MailService(nodemailer.createTransport(cfg.mail.smtpUrl!) as unknown as MailTransport, cfg);
    const ok = await mail.send({ to: 'amina@example.com', subject: 'Hello Amina', html: '<p>Hi <b>Amina</b></p>', text: 'Hi Amina' });
    expect(ok).toBe(true);
    const [m] = await smtp.waitFor(1);
    expect(m.from?.text).toContain('orders@jabali.test');
    expect(m.replyTo?.text).toContain('help@jabali.test');
    expect((m.to as { text: string }).text).toContain('amina@example.com');
    expect(m.subject).toBe('Hello Amina');
    expect(m.html).toContain('<b>Amina</b>');
    expect((m.text ?? '').trim()).toBe('Hi Amina');
  });

  it('returns false (without throwing) after retries when the server is unreachable', async () => {
    const cfg = loadConfig({ ...env, SMTP_URL: 'smtp://127.0.0.1:1' });
    const mail = new MailService(nodemailer.createTransport(cfg.mail.smtpUrl!) as unknown as MailTransport, cfg);
    mail.retryDelaysMs = [0, 0, 0];
    await expect(mail.send({ to: 'amina@example.com', subject: 'x', html: '<p>x</p>', text: 'x' })).resolves.toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx jest --selectProjects unit config.spec mail.service`
Expected: FAIL (`cfg.mail` undefined; `Cannot find module './mail.service'`).

- [ ] **Step 4: Config**

In `src/config/config.ts`:
- Add to `envSchema`:

```ts
  // Email (SMTP). Empty SMTP_URL = log-only transport in development and test.
  SMTP_URL: opt(z.string().regex(/^smtps?:\/\/\S+$/, 'SMTP_URL must start with smtp:// or smtps://')),
  MAIL_FROM: z
    .string()
    .min(3)
    .refine((v) => v.includes('@') && !/[\r\n]/.test(v), 'MAIL_FROM must be an address without line breaks')
    .default('Jabali <no-reply@jabali.co.ke>'),
  MAIL_REPLY_TO: opt(z.string().refine((v) => v.includes('@') && !/[\r\n]/.test(v), 'MAIL_REPLY_TO must be an address without line breaks')),
  STORE_URL: z.string().url().default('http://localhost:5173'),
```
- Add to the `AppConfig` type: `mail: { smtpUrl?: string; from: string; replyTo?: string; storeUrl: string };`
- In `loadConfig`, after the existing production checks add:

```ts
  if (e.NODE_ENV === 'production') {
    if (!e.SMTP_URL) throw new Error('SMTP_URL is required in production so customer email is never silently dropped');
    if (!e.STORE_URL.startsWith('https://')) throw new Error('STORE_URL must use https in production');
  }
```
  and add to the returned object: `mail: { smtpUrl: e.SMTP_URL || undefined, from: e.MAIL_FROM, replyTo: e.MAIL_REPLY_TO || undefined, storeUrl: e.STORE_URL.replace(/\/+$/, '') },`.

In `test/helpers/app.ts` add `SMTP_URL: ''` to the defaults object in `Object.assign(process.env, { ... })`.

- [ ] **Step 5: MailService, transport and module**

Create `src/mail/mail.service.ts`:

```ts
import { Inject, Injectable, Logger, Provider } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { maskEmail } from '../common/security-log/security-log.service';
import { APP_CONFIG, AppConfig } from '../config/config';

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

export interface OutgoingMail {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailTransport {
  sendMail(mail: OutgoingMail): Promise<{ messageId?: string }>;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const RECIPIENT = /^[^\s@<>,;"']+@[^\s@<>,;"']+\.[^\s@<>,;"']+$/;

/** One line, bounded: a subject can never carry extra headers. */
export const cleanSubject = (s: string): string => s.replace(/[\r\n]+/g, ' ').trim().slice(0, 200);

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    t.unref();
  });

/** Used when no SMTP server is configured (development and test): nothing leaves the machine. */
export class LogTransport implements MailTransport {
  readonly outbox: OutgoingMail[] = [];
  private readonly log = new Logger('Mail');

  sendMail(mail: OutgoingMail): Promise<{ messageId?: string }> {
    this.outbox.push(mail);
    if (this.outbox.length > 50) this.outbox.shift();
    this.log.log(`SMTP_URL is not set, so this email was not sent: "${mail.subject}" to ${maskEmail(mail.to)}`);
    return Promise.resolve({ messageId: 'log-only' });
  }
}

export const mailTransportProvider: Provider = {
  provide: MAIL_TRANSPORT,
  inject: [APP_CONFIG],
  useFactory: (cfg: AppConfig): MailTransport =>
    cfg.mail.smtpUrl
      ? (nodemailer.createTransport(cfg.mail.smtpUrl, {
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
          // Never send credentials or customer data over a plaintext SMTP session in production.
          requireTLS: cfg.nodeEnv === 'production' && cfg.mail.smtpUrl.startsWith('smtp:'),
        }) as unknown as MailTransport)
      : new LogTransport(),
};

@Injectable()
export class MailService {
  private readonly log = new Logger('Mail');
  /** Delay before each attempt, in milliseconds. Three attempts by default. */
  retryDelaysMs: number[] = [0, 2_000, 10_000];

  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  /** Resolves true once the SMTP server accepted the message. Never throws. */
  async send(msg: MailMessage): Promise<boolean> {
    if (!RECIPIENT.test(msg.to)) {
      this.log.warn('Skipped an email: invalid recipient address');
      return false;
    }
    const mail: OutgoingMail = {
      from: this.cfg.mail.from,
      to: msg.to,
      replyTo: this.cfg.mail.replyTo,
      subject: cleanSubject(msg.subject),
      html: msg.html,
      text: msg.text,
    };
    const attempts = this.retryDelaysMs.length;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (this.retryDelaysMs[attempt] > 0) await sleep(this.retryDelaysMs[attempt]);
      try {
        const info = await this.transport.sendMail(mail);
        this.log.log(`Sent "${mail.subject}" to ${maskEmail(mail.to)} (${info.messageId ?? 'no id'})`);
        return true;
      } catch (e) {
        this.log.warn(`Attempt ${attempt + 1}/${attempts} to email ${maskEmail(mail.to)} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    this.log.error(`Giving up on "${mail.subject}" to ${maskEmail(mail.to)}`);
    return false;
  }

  /** Fire and forget: mail never blocks or fails a request. */
  queue(msg: MailMessage): void {
    void this.send(msg);
  }
}
```

Create `src/mail/mail.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { MailService, mailTransportProvider } from './mail.service';

@Global()
@Module({ providers: [mailTransportProvider, MailService], exports: [MailService] })
export class MailModule {}
```

In `src/app.module.ts` import `MailModule` and add `MailModule,` after `SecurityLogModule,`.

- [ ] **Step 6: Run to verify they pass**

Run: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand mail`
Expected: build exits 0; unit PASS (config and mail.service specs); e2e PASS (2 tests). The first e2e test passing proves a real SMTP conversation, message parsing and the From/Reply-To/Subject/HTML/text parts.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/config/config.ts src/config/config.spec.ts src/mail/mail.service.ts src/mail/mail.module.ts src/mail/mail.service.spec.ts src/app.module.ts test/helpers/app.ts test/helpers/smtp.ts test/mail.e2e-spec.ts
git commit -m "feat: SMTP mail service with retries and a log-only fallback

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- package.json package-lock.json src/config/config.ts src/config/config.spec.ts src/mail/mail.service.ts src/mail/mail.module.ts src/mail/mail.service.spec.ts src/app.module.ts test/helpers/app.ts test/helpers/smtp.ts test/mail.e2e-spec.ts
```

---

## Task 15: Email templates (welcome and order confirmation with receipt)

Repo: `jabali-be`.

**Files:**
- Create: `src/mail/templates/escape.ts`, `src/mail/templates/layout.ts`, `src/mail/templates/welcome.ts`, `src/mail/templates/order-confirmation.ts`
- Test: `src/mail/templates/templates.spec.ts`

**Interfaces:**
- Produces:
  - `MailContent { subject: string; html: string; text: string }` (from `welcome.ts`).
  - `welcomeEmail({ name, storeUrl }): MailContent`
  - `ReceiptLine`, `ReceiptOrder` and `orderConfirmationEmail({ order, storeUrl }): MailContent` (from `order-confirmation.ts`). `ReceiptOrder` is structurally satisfied by the result of `OrdersService.view()`.
  - Helpers `esc`, `kes`, `nairobiTime`, `firstName`, `trimSlash` (from `escape.ts`).

- [ ] **Step 1: Write the failing tests**

Create `src/mail/templates/templates.spec.ts`:

```ts
import { esc, firstName, kes, trimSlash } from './escape';
import { orderConfirmationEmail, ReceiptOrder } from './order-confirmation';
import { welcomeEmail } from './welcome';

const store = 'https://shop.example.com/';

const order = (over: Partial<ReceiptOrder> = {}): ReceiptOrder => ({
  number: 'JB-000123',
  createdAt: new Date('2026-10-14T17:30:00Z'),
  method: 'delivery',
  paymentMethod: 'mpesa',
  subtotal: 6400,
  discount: 400,
  deliveryFee: 250,
  total: 6250,
  county: 'Nairobi',
  address: 'Kilimani, Argwings Kodhek Rd, Apt 4',
  eta: 'Same-day if ordered before 2 pm',
  customer: { name: 'Amina Said' },
  lines: [
    { name: 'Oxford Button-Down', colour: 'Sky', size: 'M', qty: 2, unitPrice: 3200, discount: 400, lineTotal: 6000, gift: null },
    { name: 'Woven Silk Tie', colour: 'Navy', size: 'One size', qty: 1, unitPrice: 400, discount: 0, lineTotal: 400, gift: { wrap: 'forest' } },
  ],
  ...over,
});

describe('escape helpers', () => {
  it('escapes HTML metacharacters', () => {
    expect(esc(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
    expect(esc(null)).toBe('');
  });
  it('formats shillings, first names and URLs', () => {
    expect(kes(3200)).toBe('KES 3,200');
    expect(kes(0)).toBe('KES 0');
    expect(firstName('  Amina  Said ')).toBe('Amina');
    expect(firstName('   ')).toBe('there');
    expect(trimSlash('https://a.co///')).toBe('https://a.co');
  });
});

describe('welcomeEmail', () => {
  const mail = welcomeEmail({ name: 'Amina Said', storeUrl: store });
  it('greets by first name and links to the shop', () => {
    expect(mail.subject).toMatch(/Welcome to Jabali/);
    expect(mail.html).toContain('Amina');
    expect(mail.html).toContain('href="https://shop.example.com/shop"');
    expect(mail.text).toContain('https://shop.example.com/shop');
  });
  it('has the three onboarding steps in both parts and never mentions a password or token', () => {
    for (const part of [mail.html, mail.text]) {
      expect(part).toMatch(/M-Pesa/);
      expect(part).toMatch(/Same-day delivery in Nairobi/);
      expect(part).not.toMatch(/password|token/i);
    }
  });
  it('escapes a hostile name', () => {
    const evil = welcomeEmail({ name: '<script>alert(1)</script> Amina', storeUrl: store });
    expect(evil.html).not.toContain('<script');
    expect(evil.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('orderConfirmationEmail', () => {
  const mail = orderConfirmationEmail({ order: order(), storeUrl: store });

  it('puts the order number in the subject and the receipt in the body', () => {
    expect(mail.subject).toBe('Order JB-000123 received: your Jabali receipt');
    expect(mail.html).toContain('JB-000123');
    expect(mail.html).toMatch(/2026/);
  });

  it('lists every line with colour, size, quantity and amounts', () => {
    for (const part of [mail.html, mail.text]) {
      expect(part).toContain('Oxford Button-Down');
      expect(part).toContain('Sky');
      expect(part).toContain('KES 3,200');
      expect(part).toContain('KES 6,000');
      expect(part).toContain('Woven Silk Tie');
      expect(part).toContain('KES 400');
    }
  });

  it('shows subtotal, discount, delivery and the total', () => {
    for (const part of [mail.html, mail.text]) {
      expect(part).toContain('KES 6,400');
      expect(part).toContain('KES 6,250');
      expect(part).toContain('KES 250');
    }
    expect(mail.text).toMatch(/Discount.*-KES 400/);
  });

  it('shows Free for a zero delivery fee and hides a zero discount', () => {
    const free = orderConfirmationEmail({ order: order({ deliveryFee: 0, discount: 0, total: 6400 }), storeUrl: store });
    expect(free.text).toMatch(/Delivery\s+Free/);
    expect(free.text).not.toMatch(/Discount/);
  });

  it('explains what happens next for each payment method', () => {
    expect(mail.text).toMatch(/M-Pesa prompt/);
    expect(mail.text).toMatch(/30 minutes/);
    expect(orderConfirmationEmail({ order: order({ paymentMethod: 'cod' }), storeUrl: store }).text).toMatch(/Pay KES 6,250 to the rider/);
    expect(orderConfirmationEmail({ order: order({ paymentMethod: 'airtel' }), storeUrl: store }).text).toMatch(/Airtel/);
    expect(orderConfirmationEmail({ order: order({ paymentMethod: 'card' }), storeUrl: store }).text).toMatch(/card payment/i);
  });

  it('shows the delivery address and estimate, or the pickup address', () => {
    expect(mail.text).toContain('Kilimani, Argwings Kodhek Rd, Apt 4');
    expect(mail.text).toContain('Same-day if ordered before 2 pm');
    const pickup = orderConfirmationEmail({ order: order({ method: 'pickup', county: null, address: 'Jabali Studio, Nairobi CBD', eta: null, deliveryFee: 0 }), storeUrl: store });
    expect(pickup.text).toMatch(/Pickup at/);
    expect(pickup.text).toContain('Jabali Studio, Nairobi CBD');
    expect(pickup.text).not.toMatch(/Delivery to/);
  });

  it('marks gift-wrapped lines', () => {
    expect(mail.html).toMatch(/Gift wrapped/);
    expect(mail.text).toMatch(/Gift wrapped/);
  });

  it('escapes hostile names, addresses and product names, and keeps the subject on one line', () => {
    const evil = orderConfirmationEmail({
      order: order({
        number: 'JB-1\r\nBcc: evil@example.com',
        customer: { name: '<script>x</script>' },
        address: '"><img src=x onerror=alert(1)>',
        lines: [{ name: '<b>Suit</b>', colour: '"><i>', size: "'", qty: 1, unitPrice: 100, discount: 0, lineTotal: 100, gift: null }],
      }),
      storeUrl: store,
    });
    expect(evil.html).not.toMatch(/<script|<img |<b>Suit|<i>/);
    expect(evil.html).toContain('&lt;b&gt;Suit&lt;/b&gt;');
    expect(evil.subject).not.toMatch(/[\r\n]/);
  });

  it('links only to the configured store', () => {
    const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(h.startsWith('https://shop.example.com')).toBe(true);
  });

  it('copes with a missing order number', () => {
    expect(orderConfirmationEmail({ order: order({ number: null }), storeUrl: store }).subject).toBe('Order received: your Jabali receipt');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest --selectProjects unit templates`
Expected: FAIL (`Cannot find module './escape'`).

- [ ] **Step 3: Helpers and layout**

Create `src/mail/templates/escape.ts`:

```ts
const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** HTML-escapes any value. Every value that reaches an email template goes through this. */
export const esc = (v: unknown): string => String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

export const kes = (n: number): string => `KES ${new Intl.NumberFormat('en-KE').format(n)}`;

export const nairobiTime = (d: Date): string =>
  new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(d);

export const firstName = (full: string): string => full.trim().split(/\s+/)[0] || 'there';

export const trimSlash = (url: string): string => url.replace(/\/+$/, '');
```

Create `src/mail/templates/layout.ts`:

```ts
import { esc } from './escape';

/** Table-based layout with inline styles (email clients ignore most CSS). Jabali colours: ink #111311, accent #c6e24f. */
export function layout(opts: { preheader: string; bodyHtml: string; storeUrl: string }): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Jabali</title></head>
<body style="margin:0;background:#f4f4f1;font-family:Helvetica,Arial,sans-serif;color:#111311;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f1;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">
<tr><td style="background:#111311;padding:20px 28px;"><a href="${esc(opts.storeUrl)}" style="color:#c6e24f;font-size:22px;font-weight:700;letter-spacing:2px;text-decoration:none;">JABALI</a></td></tr>
<tr><td style="padding:28px;">${opts.bodyHtml}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e5e5e0;color:#6b6f6b;font-size:12px;line-height:1.5;">Prices in Kenya Shillings and include VAT.<br>Jabali &middot; <a href="${esc(opts.storeUrl)}" style="color:#6b6f6b;">${esc(opts.storeUrl.replace(/^https?:\/\//, ''))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export const button = (href: string, label: string): string =>
  `<a href="${esc(href)}" style="display:inline-block;background:#c6e24f;color:#111311;font-weight:700;text-decoration:none;padding:14px 28px;">${esc(label)}</a>`;
```

- [ ] **Step 4: Welcome template**

Create `src/mail/templates/welcome.ts`:

```ts
import { esc, firstName, trimSlash } from './escape';
import { button, layout } from './layout';

export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

const STEPS: [string, string][] = [
  ['Find something you like', 'Browse suits, shirts, dresses and more. Every piece shows the sizes that are in stock.'],
  ['Pay your way', 'M-Pesa and Airtel Money prompts go straight to your phone. In Nairobi you can also pay on delivery.'],
  ['We bring it to you', 'Same-day delivery in Nairobi for orders before 2 pm, and 2 to 5 days to other counties.'],
];

export function welcomeEmail(input: { name: string; storeUrl: string }): MailContent {
  const store = trimSlash(input.storeUrl);
  const name = firstName(input.name);
  const shop = `${store}/shop`;

  const stepsHtml = STEPS.map(
    ([title, body], i) =>
      `<tr><td style="padding:10px 0;vertical-align:top;width:32px;font-weight:700;color:#111311;">${i + 1}</td><td style="padding:10px 0;"><strong>${esc(title)}</strong><br><span style="color:#4a4e4a;">${esc(body)}</span></td></tr>`,
  ).join('');

  const html = layout({
    preheader: 'Your Jabali account is ready.',
    storeUrl: store,
    bodyHtml: `<h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;">Welcome to Jabali, ${esc(name)}.</h1>
<p style="margin:0 0 20px;line-height:1.6;color:#4a4e4a;">Your account is ready. Sign in with this email address whenever you shop, and your details will be filled in at checkout.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">${stepsHtml}</table>
${button(shop, 'Start shopping')}`,
  });

  const text = [
    `Welcome to Jabali, ${name}.`,
    '',
    'Your account is ready. Sign in with this email address whenever you shop, and your details will be filled in at checkout.',
    '',
    ...STEPS.map(([title, body], i) => `${i + 1}. ${title}\n   ${body}`),
    '',
    `Start shopping: ${shop}`,
    '',
    'Prices in Kenya Shillings and include VAT.',
  ].join('\n');

  return { subject: 'Welcome to Jabali', html, text };
}
```

- [ ] **Step 5: Order confirmation template**

Create `src/mail/templates/order-confirmation.ts`:

```ts
import { esc, kes, nairobiTime, trimSlash } from './escape';
import { button, layout } from './layout';
import type { MailContent } from './welcome';

export interface ReceiptLine {
  name: string;
  colour: string;
  size: string;
  qty: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  /** Gift options when the line is a gift, otherwise null. */
  gift: unknown;
}

/** The slice of an order the receipt needs. `OrdersService.view()` satisfies it. */
export interface ReceiptOrder {
  number: string | null;
  createdAt: Date;
  method: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  county: string | null;
  address: string | null;
  eta: string | null;
  customer: { name: string };
  lines: ReceiptLine[];
}

const PAYMENT_LABEL: Record<string, string> = { mpesa: 'M-Pesa', airtel: 'Airtel Money', card: 'Card', cod: 'Pay on delivery' };

function paymentNote(method: string, total: number): string {
  switch (method) {
    case 'mpesa':
      return `Approve the M-Pesa prompt on your phone to pay ${kes(total)}. We hold your items for 30 minutes.`;
    case 'airtel':
      return `Approve the Airtel Money prompt on your phone to pay ${kes(total)}. We hold your items for 30 minutes.`;
    case 'card':
      return `Complete your card payment of ${kes(total)} to confirm the order. We hold your items for 30 minutes.`;
    case 'cod':
      return `Pay ${kes(total)} to the rider when your order arrives (cash or M-Pesa).`;
    default:
      return '';
  }
}

export function orderConfirmationEmail(input: { order: ReceiptOrder; storeUrl: string }): MailContent {
  const { order } = input;
  const store = trimSlash(input.storeUrl);
  const number = order.number ?? '';
  const subject = number ? `Order ${number} received: your Jabali receipt` : 'Order received: your Jabali receipt';
  const placed = nairobiTime(order.createdAt);
  const pay = PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod;
  const note = paymentNote(order.paymentMethod, order.total);
  const where = order.method === 'pickup' ? 'Pickup at' : 'Delivery to';
  const address = [order.address, order.method === 'delivery' ? order.county : null].filter(Boolean).join(', ');
  const delivery = order.deliveryFee === 0 ? 'Free' : kes(order.deliveryFee);

  const cell = 'padding:10px 0;border-bottom:1px solid #e5e5e0;vertical-align:top;';
  const rows = order.lines
    .map(
      (l) => `<tr>
<td style="${cell}"><strong>${esc(l.name)}</strong><br><span style="color:#6b6f6b;font-size:13px;">${esc(l.colour)} &middot; ${esc(l.size)}${l.gift ? ' &middot; Gift wrapped' : ''}</span></td>
<td style="${cell}text-align:center;">${esc(l.qty)}</td>
<td style="${cell}text-align:right;">${esc(kes(l.unitPrice))}</td>
<td style="${cell}text-align:right;">${esc(kes(l.lineTotal))}</td></tr>`,
    )
    .join('');

  const totalRow = (label: string, value: string, bold = false) =>
    `<tr><td colspan="3" style="padding:6px 0;text-align:right;color:#4a4e4a;${bold ? 'font-weight:700;color:#111311;font-size:16px;' : ''}">${esc(label)}</td><td style="padding:6px 0;text-align:right;${bold ? 'font-weight:700;font-size:16px;' : ''}">${esc(value)}</td></tr>`;

  const html = layout({
    preheader: `Order ${number} received. Total ${kes(order.total)}.`,
    storeUrl: store,
    bodyHtml: `<h1 style="margin:0 0 8px;font-size:26px;line-height:1.2;">Thanks, ${esc(order.customer.name.trim().split(/\s+/)[0] || 'there')}. We have your order.</h1>
<p style="margin:0 0 20px;color:#4a4e4a;">${number ? `Order <strong>${esc(number)}</strong> &middot; ` : ''}${esc(placed)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 8px;">
<tr><th align="left" style="padding:8px 0;border-bottom:2px solid #111311;">Item</th><th style="padding:8px 0;border-bottom:2px solid #111311;">Qty</th><th align="right" style="padding:8px 0;border-bottom:2px solid #111311;">Price</th><th align="right" style="padding:8px 0;border-bottom:2px solid #111311;">Total</th></tr>
${rows}
${totalRow('Subtotal', kes(order.subtotal))}${order.discount > 0 ? totalRow('Discount', `-${kes(order.discount)}`) : ''}${totalRow('Delivery', delivery)}${totalRow('Total', kes(order.total), true)}
</table>
<h2 style="margin:24px 0 6px;font-size:16px;">Payment</h2>
<p style="margin:0;line-height:1.6;color:#4a4e4a;"><strong style="color:#111311;">${esc(pay)}.</strong> ${esc(note)}</p>
<h2 style="margin:24px 0 6px;font-size:16px;">${esc(where)}</h2>
<p style="margin:0 0 24px;line-height:1.6;color:#4a4e4a;">${esc(address)}${order.eta ? `<br>${esc(order.eta)}` : ''}</p>
${button(`${store}/shop`, 'Continue shopping')}`,
  });

  const line = (label: string, value: string) => `${label.padEnd(10)}${value}`;
  const text = [
    `Thanks, ${order.customer.name.trim().split(/\s+/)[0] || 'there'}. We have your order.`,
    number ? `Order ${number} - ${placed}` : placed,
    '',
    ...order.lines.flatMap((l) => [
      `${l.name} (${l.colour}, ${l.size})${l.gift ? ' - Gift wrapped' : ''}`,
      `  ${l.qty} x ${kes(l.unitPrice)} = ${kes(l.lineTotal)}`,
    ]),
    '',
    line('Subtotal', kes(order.subtotal)),
    ...(order.discount > 0 ? [line('Discount', `-${kes(order.discount)}`)] : []),
    line('Delivery', delivery),
    line('Total', kes(order.total)),
    '',
    `Payment: ${pay}`,
    note,
    '',
    `${where}: ${address}`,
    ...(order.eta ? [order.eta] : []),
    '',
    `Continue shopping: ${store}/shop`,
    '',
    'Prices in Kenya Shillings and include VAT.',
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  return { subject: subject.replace(/[\r\n]+/g, ' '), html, text };
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx jest --selectProjects unit templates`
Expected: PASS (all template tests). If the `Delivery\s+Free` or `Discount.*-KES 400` assertions fail, compare the exact text-body spacing produced by `line()` (a 10-character padded label) and fix the template or the pattern so both agree; do not weaken the escaping or amount assertions.

- [ ] **Step 7: Commit**

```bash
git add src/mail/templates
git commit -m "feat: welcome and order confirmation (receipt) email templates

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/mail/templates
```

---

## Task 16: Send the emails, local mail catcher, docs, final verification

Repo: `jabali-be`.

**Files:**
- Modify: `src/mail/mail.service.ts`, `src/customer-auth/customer-auth.service.ts`, `src/checkout/checkout.controller.ts`, `docker-compose.yml`, `.env.example`, `package.json`, `docs/security/CONTROL-MATRIX.md`
- Create: `scripts/send-sample-mails.ts`, `docs/email.md`
- Test: `test/mail-flows.e2e-spec.ts`, `src/mail/mail-helpers.spec.ts`

**Interfaces:**
- Consumes: `MailService.queue`, templates (Tasks 14-15), `CustomerAuthService.register`, `OrdersService.checkout` result.
- Produces: `MailService.sendWelcome(to: string, name: string): void` and `MailService.sendOrderConfirmation(to: string, order: ReceiptOrder): void`; a welcome email after every successful registration; an order confirmation after every newly created order (not on an idempotent replay).

- [ ] **Step 1: Write the failing tests**

Create `src/mail/mail-helpers.spec.ts`:

```ts
import type { AppConfig } from '../config/config';
import { MailService, MailTransport } from './mail.service';
import type { ReceiptOrder } from './templates/order-confirmation';

const cfg = { nodeEnv: 'test', mail: { from: 'Jabali <no-reply@jabali.co.ke>', storeUrl: 'https://shop.example.com' } } as unknown as AppConfig;

function make() {
  const sendMail = jest.fn().mockResolvedValue({ messageId: 'x' });
  const service = new MailService({ sendMail } as MailTransport, cfg);
  service.retryDelaysMs = [0];
  return { service, sendMail };
}

const flush = () => new Promise((r) => setTimeout(r, 20));

describe('MailService helpers', () => {
  it('sendWelcome queues the welcome email to the customer', async () => {
    const { service, sendMail } = make();
    service.sendWelcome('amina@example.com', 'Amina Said');
    await flush();
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: 'amina@example.com', subject: 'Welcome to Jabali' });
    expect(sendMail.mock.calls[0][0].html).toContain('https://shop.example.com/shop');
  });

  it('sendOrderConfirmation queues the receipt with the order number in the subject', async () => {
    const { service, sendMail } = make();
    const order: ReceiptOrder = {
      number: 'JB-000007', createdAt: new Date(), method: 'pickup', paymentMethod: 'cod', subtotal: 1000, discount: 0, deliveryFee: 0, total: 1000,
      county: null, address: 'Studio', eta: null, customer: { name: 'Amina' },
      lines: [{ name: 'Tee', colour: 'White', size: 'M', qty: 1, unitPrice: 1000, discount: 0, lineTotal: 1000, gift: null }],
    };
    service.sendOrderConfirmation('amina@example.com', order);
    await flush();
    expect(sendMail.mock.calls[0][0].subject).toContain('JB-000007');
    expect(sendMail.mock.calls[0][0].text).toContain('KES 1,000');
  });
});
```

Create `test/mail-flows.e2e-spec.ts`:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { bootApp, json } from './helpers/app';
import { startSmtp, TestSmtp } from './helpers/smtp';

jest.setTimeout(60_000);

const register = (base: string, over: Record<string, unknown> = {}) =>
  fetch(`${base}/store/auth/register`, json({ name: 'Amina Said', email: `amina${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`, phone: `07${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`, password: 'Sunrise-over-Nairobi-42', ...over }));

describe('welcome email', () => {
  let smtp: TestSmtp;
  let app: NestExpressApplication;
  let base: string;
  beforeAll(async () => {
    smtp = await startSmtp();
    ({ app, base } = await bootApp({ RATE_LIMIT_ENABLED: 'false', SMTP_URL: smtp.url, MAIL_FROM: 'Jabali <orders@jabali.test>', STORE_URL: 'https://shop.example.com' }));
  });
  afterAll(async () => {
    await app.close();
    await smtp.close();
  });

  it('is delivered over SMTP after a successful registration', async () => {
    const email = `welcome${Date.now()}@example.com`;
    const r = await register(base, { email });
    expect(r.status).toBe(201);
    const [m] = await smtp.waitFor(1);
    expect((m.to as { text: string }).text).toContain(email);
    expect(m.from?.text).toContain('orders@jabali.test');
    expect(m.subject).toBe('Welcome to Jabali');
    expect(m.html).toContain('Amina');
    expect(m.text).toContain('https://shop.example.com/shop');
  });

  it('is not sent when registration is rejected', async () => {
    const before = smtp.messages.length;
    const r = await register(base, { password: 'short' });
    expect(r.status).toBe(422);
    await new Promise((res) => setTimeout(res, 300));
    expect(smtp.messages.length).toBe(before);
  });
});

describe('registration when the mail server is down', () => {
  let app: NestExpressApplication;
  let base: string;
  beforeAll(async () => {
    const smtp = await startSmtp();
    const deadUrl = smtp.url;
    await smtp.close(); // the port is now closed
    ({ app, base } = await bootApp({ RATE_LIMIT_ENABLED: 'false', SMTP_URL: deadUrl }));
  });
  afterAll(async () => {
    await app.close();
  });

  it('still succeeds, quickly', async () => {
    const t = Date.now();
    const r = await register(base);
    expect(r.status).toBe(201);
    expect(Date.now() - t).toBeLessThan(5_000);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest --selectProjects unit mail-helpers && npx jest --selectProjects e2e --runInBand mail-flows`
Expected: unit FAIL (`service.sendWelcome is not a function`); e2e FAIL (no email arrives: `expected 1 message(s), received 0`).

- [ ] **Step 3: Helpers on MailService**

In `src/mail/mail.service.ts` add imports `import { orderConfirmationEmail, ReceiptOrder } from './templates/order-confirmation';` and `import { welcomeEmail } from './templates/welcome';` and add these methods inside `MailService` after `queue`:

```ts
  /** Onboarding email after sign-up. */
  sendWelcome(to: string, name: string): void {
    this.queue({ to, ...welcomeEmail({ name, storeUrl: this.cfg.mail.storeUrl }) });
  }

  /** Order confirmation with the receipt in the body. */
  sendOrderConfirmation(to: string, order: ReceiptOrder): void {
    this.queue({ to, ...orderConfirmationEmail({ order, storeUrl: this.cfg.mail.storeUrl }) });
  }
```

- [ ] **Step 4: Send on register and on order creation**

In `src/customer-auth/customer-auth.service.ts` import `MailService` (`../mail/mail.service`), add `private readonly mail: MailService,` to the constructor (after the security log parameter), and in `register`, right after `const tokens = await this.issue(account, randomUUID(), meta);` add `this.mail.sendWelcome(email, name);` (before the return, inside the `try`).

In `src/checkout/checkout.controller.ts` import `MailService` from `../mail/mail.service`, add `private readonly mail: MailService,` to the constructor, and in `checkout`, after `const { order, created } = await this.orders.checkout(dto, key, customer.customerId);` add:

```ts
    // Only for a newly created order: an idempotent replay must not email the receipt again.
    if (created) this.mail.sendOrderConfirmation(customer.email, order);
```

- [ ] **Step 5: Run to verify they pass**

Run: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand`
Expected: build exits 0 (this also proves `OrdersService.view()` satisfies `ReceiptOrder` structurally; if the compiler objects, fix the interface to match `view()`, not the other way round); unit PASS; every e2e file PASS including `mail-flows` (3 tests).

- [ ] **Step 6: Local mail catcher, sample sender and docs**

In `docker-compose.yml` add under `services:` (after `postgres`):

```yaml
  mailpit:
    # Dev-only mail catcher: nothing is delivered to real addresses. UI and API on 8025.
    image: axllent/mailpit:latest
    container_name: jabali-mailpit
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"
```

Append to `.env.example`:

```
# Email (SMTP). Empty SMTP_URL = log-only in development and test (nothing is sent).
# Local catcher (docker compose up -d mailpit): SMTP_URL=smtp://localhost:1025 and open http://localhost:8025
# Production requires SMTP_URL (e.g. smtp://user:pass@smtp.example.com:587) and an https STORE_URL.
SMTP_URL=
MAIL_FROM=Jabali <no-reply@jabali.co.ke>
MAIL_REPLY_TO=
STORE_URL=http://localhost:5173
```

Create `scripts/send-sample-mails.ts`:

```ts
import * as nodemailer from 'nodemailer';
import { loadConfig } from '../src/config/config';
import { MailService, MailTransport } from '../src/mail/mail.service';
import type { ReceiptOrder } from '../src/mail/templates/order-confirmation';

try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}

/** Sends the welcome email and a sample order receipt through the configured SMTP server (default: local Mailpit). */
async function main(): Promise<void> {
  const cfg = loadConfig({ ...process.env, SMTP_URL: process.env.SMTP_URL || 'smtp://localhost:1025' });
  const mail = new MailService(nodemailer.createTransport(cfg.mail.smtpUrl!) as unknown as MailTransport, cfg);
  mail.retryDelaysMs = [0];
  const to = process.argv[2] ?? 'amina@example.com';
  const order: ReceiptOrder = {
    number: 'JB-000123',
    createdAt: new Date(),
    method: 'delivery',
    paymentMethod: 'mpesa',
    subtotal: 6400,
    discount: 400,
    deliveryFee: 250,
    total: 6250,
    county: 'Nairobi',
    address: 'Kilimani, Argwings Kodhek Rd, Apt 4',
    eta: 'Same-day if ordered before 2 pm',
    customer: { name: 'Amina Said' },
    lines: [
      { name: 'Oxford Button-Down', colour: 'Sky', size: 'M', qty: 2, unitPrice: 3200, discount: 400, lineTotal: 6000, gift: null },
      { name: 'Woven Silk Tie', colour: 'Navy', size: 'One size', qty: 1, unitPrice: 400, discount: 0, lineTotal: 400, gift: { wrap: 'forest' } },
    ],
  };
  const { welcomeEmail } = await import('../src/mail/templates/welcome');
  const { orderConfirmationEmail } = await import('../src/mail/templates/order-confirmation');
  const a = await mail.send({ to, ...welcomeEmail({ name: 'Amina Said', storeUrl: cfg.mail.storeUrl }) });
  const b = await mail.send({ to, ...orderConfirmationEmail({ order, storeUrl: cfg.mail.storeUrl }) });
  console.log(`welcome: ${a ? 'sent' : 'FAILED'}, order confirmation: ${b ? 'sent' : 'FAILED'} (to ${to} via ${cfg.mail.smtpUrl?.replace(/\/\/.*@/, '//***@')})`);
  process.exit(a && b ? 0 : 1);
}

void main();
```

In `package.json` add the script `"mail:sample": "tsx scripts/send-sample-mails.ts"`.

Create `docs/email.md`:

```md
# Email

The API sends two transactional emails: a **welcome** message after sign-up and an **order confirmation with the receipt in the message body** (HTML plus plain text) when an order is created. Templates live in `src/mail/templates/`. Sending is fire-and-forget with three attempts; a mail failure never fails the request.

## Configure

| Variable | Meaning |
|---|---|
| `SMTP_URL` | `smtp://user:pass@host:587` (STARTTLS) or `smtps://user:pass@host:465`. Empty = log-only (development and test). Required in production. |
| `MAIL_FROM` | Sender, e.g. `Jabali <orders@yourdomain.com>`. The domain needs SPF, DKIM and DMARC records at your provider or mail will land in spam. |
| `MAIL_REPLY_TO` | Optional reply address. |
| `STORE_URL` | Public storefront URL used for links. https in production. |

Any SMTP provider works (Amazon SES SMTP, SendGrid, Mailgun, Zoho, Google Workspace app password). Production connections to `smtp://` require TLS.

## Try it locally

1. `docker compose up -d mailpit` (SMTP on 1025, inbox UI on http://localhost:8025).
2. Put `SMTP_URL=smtp://localhost:1025` in `.env` and restart the API.
3. Register a customer through the storefront (or `POST /api/v1/store/auth/register`): the welcome email appears in Mailpit.
4. `npm run mail:sample` sends the welcome email and a sample receipt so you can review both layouts.

## Known limits

- The storefront checkout still simulates orders locally, so the order email is sent only for orders created through the API (`POST /api/v1/store/orders`) until real order placement is wired into the storefront.
- Retries are in memory; a crash during the retry window loses that email. A database-backed outbox is the upgrade path.
- Not built yet: email verification, password reset, order status emails, PDF receipt attachment.
```

In `docs/security/CONTROL-MATRIX.md`: replace the row starting `| 23 |` with `| 23 | Email verification and password reset (the mail transport now exists; these flows are not built) | 2.1.x, 2.5.x | A.5.17 | not built | n/a | Organisational gap |` and insert after row 22 these rows (renumbering is not required; keep the table order):

```
| 22a | Email content is HTML-escaped, subjects cannot carry extra headers, links use only the configured store URL | 5.3.3, 5.3.10 | A.8.28 | `src/mail/templates/*`, `mail.service.ts` | `templates.spec.ts`, `mail.service.spec.ts` | Implemented |
| 22b | SMTP credentials only in environment variables; TLS required for `smtp://` in production; production refuses to start without SMTP | 9.1.x, 14.1.3 | A.8.24, A.8.9 | `config.ts`, `mail.service.ts` | `config.spec.ts` | Implemented |
| 22c | Email logging masks recipients and never logs bodies | 7.1.1, 7.1.2 | A.8.15 | `mail.service.ts` | `mail.service.spec.ts` | Implemented |
| 22d | Sender authentication for the mail domain (SPF, DKIM, DMARC) and mail delivery monitoring | n/a | A.8.20, A.5.14 | n/a | n/a | Organisational gap |
```

- [ ] **Step 7: Prove it with a real SMTP server (Mailpit)**

Run: `docker compose up -d mailpit` (if ports 1025 or 8025 are taken, stop and report which process holds them instead of changing other people's containers).
Run: `npm run mail:sample`
Expected: prints `welcome: sent, order confirmation: sent`.
Run: `curl -s http://localhost:8025/api/v1/messages`
Expected: JSON listing 2 messages with subjects `Welcome to Jabali` and `Order JB-000123 received: your Jabali receipt`. Fetch one (`curl -s http://localhost:8025/api/v1/message/<ID>`) and confirm the HTML part contains `KES 6,250` and the Text part is present.
Then `docker compose rm -sf mailpit` is NOT required; leaving the dev catcher running is fine.

- [ ] **Step 8: Final verification across both repos**

Run in `jabali-be`: `npm run build && npx jest --selectProjects unit && npx jest --selectProjects e2e --runInBand && npm audit --omit=dev --audit-level=high`
Expected: all pass; audit exits 0.
Run in `gift-shoe-app`: `npm test && npx tsc --noEmit && npm run audit`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/mail/mail.service.ts src/mail/mail-helpers.spec.ts src/customer-auth/customer-auth.service.ts src/checkout/checkout.controller.ts docker-compose.yml .env.example package.json scripts/send-sample-mails.ts docs/email.md docs/security/CONTROL-MATRIX.md test/mail-flows.e2e-spec.ts
git commit -m "feat: send welcome and order confirmation emails, local mail catcher, docs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- src/mail/mail.service.ts src/mail/mail-helpers.spec.ts src/customer-auth/customer-auth.service.ts src/checkout/checkout.controller.ts docker-compose.yml .env.example package.json scripts/send-sample-mails.ts docs/email.md docs/security/CONTROL-MATRIX.md test/mail-flows.e2e-spec.ts
```

---

## Self-review (done while writing)

- **Spec coverage:** customer auth spec sections 1-7 map to Tasks 2-4 (data, API, token isolation, orders) and 5-7 (storefront state, API layer, UI); the hardening spec's storefront controls to Task 12 (headers/CSP, safe URLs, source scan, env check, audit script, error handling is existing plus `ErrorState`), backend controls to Tasks 8-11, the control matrix to Task 13. Spec items changed during planning are listed under "Deviations".
- **Email coverage:** the email spec's messages, config, transport, retries, escaping, local catcher and honest limits map to Tasks 14-16.
- **Placeholders:** none; the two steps that depend on live output (Task 8 audit results, Task 13 advisory list) say exactly what to run and what to record.
- **Type consistency:** `CustomerAuthUser`/`CustomerTokenPayload`/`CustomerAuthGuard`/`CurrentCustomer` (Task 2) are used verbatim in Tasks 3-4; `checkout(dto, key, customerId)` (Task 4) matches the controller call; storefront `AuthUser`/`AuthState`/action names (Task 5) match Tasks 6-7; hook names in Task 6 match Task 7; `RateLimit`/`perMinute` (Task 10) match the controller decorators; `SecurityLogService.log` (Task 11) matches its callers; `bootApp`/`json` (Task 3) are used by Tasks 4, 9, 10.
