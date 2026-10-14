# Customer accounts and checkout sign-in: design

Date: 2026-10-14
Repos: `jabali-be` (NestJS API), `gift-shoe-app` (storefront). `jabali-dashboard` unchanged.
Sub-project 1 of 2. Sub-project 2 is `2026-10-14-security-hardening-design.md`, which builds on this one.

## Goal

A customer who is not signed in must sign in or create an account before they can check out. The backend stores accounts, issues and rotates tokens, and attaches orders to the account.

## Decisions taken with the user

- Checkout **requires** an account (no guest checkout).
- Sign-in identifier is **email + password**; the phone number is collected at sign-up and stays the unique key used by orders and M-Pesa.
- Scope is **auth + checkout gate only**. Real order placement, cart quote and M-Pesa from the storefront remain a separate follow-up; the storefront keeps its local order simulation.

## Out of scope

Email verification, password reset and change (no mail provider yet), order history and order tracking for accounts, social login, MFA, real order and payment wiring from the storefront.

## 1. Backend data (`jabali-be`)

One Prisma migration adds:

- `CustomerAccount`: `id`, `customerId` (unique FK to `Customer`, cascade), `email` (unique, stored lowercased), `passwordHash` (argon2id), `status` (`active` | `disabled`), `failedLogins`, `lockedUntil`, `lastLoginAt`, timestamps.
- `CustomerRefreshToken`: same shape and semantics as the staff `RefreshToken` (hashed token, `familyId`, `expiresAt`, `revokedAt`, `replacedById`, `ip`, `userAgent`), FK to `CustomerAccount`.

`Customer` and existing guest orders are not changed. Email uniqueness is enforced by the database, not by a check-then-insert.

## 2. Backend API (public, no admin permissions)

| Endpoint | Behaviour |
|---|---|
| `POST /store/auth/register` | Body `{name, email, phone, password}`. Normalises the phone with `normalizePhone` (invalid: 422). Creates the account and links or creates the `Customer` by phone in one transaction. 201 with `{customer, accessToken, refreshToken, expiresIn, refreshExpiresAt}`. 409 if the email already has an account, or the phone already belongs to an account. |
| `POST /store/auth/login` | `{email, password}`. Generic "Invalid email or password" for unknown email and wrong password; equalised timing for unknown emails (dummy hash). 5 failed attempts lock the account 15 minutes, as for staff. |
| `POST /store/auth/refresh` | `{refreshToken}`. Rotation with reuse detection: a reused token revokes the whole family. |
| `POST /store/auth/logout` | `{refreshToken}`. Revokes the family. 204. |
| `GET /store/me`, `PATCH /store/me` | Customer-guarded. `PATCH` updates name and phone (same uniqueness rules). |

- Password policy: 12 to 128 characters, rejected if it is in a bundled list of the most common passwords or equals the email. No composition rules (ASVS 4.0 L2).
- Refresh tokens are returned in the response body (no cookie), like the dashboard flow; the storefront and API are on different origins.
- Registering a phone that already has **guest orders** attaches the account to that `Customer` so returning customers keep their history. There is no phone verification, so this endpoint set exposes **no order history**; verifying the phone before exposing history is a recorded follow-up.

## 3. Token isolation

Customer and staff tokens use the same JWT secret. Customer access tokens carry `typ: "customer"`. The staff `JwtAuthGuard` rejects any token with `typ === "customer"`; the new `CustomerAuthGuard` accepts only `typ === "customer"`. Existing staff tokens have no `typ` and keep working. Tests cover a customer token on an admin route and a staff token on `/store/me`, both rejected.

## 4. Orders

`POST /store/orders` requires a valid customer access token (anonymous requests get 401). The order is attached to the account's `Customer`; the `customer` block in `CheckoutDto` becomes optional and is ignored for identity. This changes a public endpoint's behaviour; nothing else calls it today.

## 5. Storefront

- `auth` slice (Redux): `user`, `accessToken`, `refreshToken`. The refresh token is persisted in `localStorage`; the access token is kept in memory only and re-obtained through refresh on load, which limits what script injection can read.
- RTK Query: `register`, `login`, `refresh`, `logout`, `getMe`, `updateMe` endpoints in `src/api/auth.ts`. The `Authorization` header is attached only to authenticated endpoints (not to public GETs), so catalogue requests stay simple cross-origin requests. A 401 triggers one refresh and one retry; a failed refresh signs the customer out.
- Checkout guard: `/checkout` renders an in-page panel with "Sign in" and "Create account" tabs when the visitor is not signed in, then continues to checkout on success. Forms validate with the same password rules and show server errors (problem+json) without revealing whether an email exists on login.
- Checkout form is prefilled from the account (name, phone, email).
- Header account control: shows the customer's name and a "Sign out" action; "Sign in" when signed out.

## 6. Testing

- Backend e2e (`test/customer-auth.e2e-spec.ts`): register, duplicate email, duplicate phone, invalid phone, weak and common passwords, login success and failure, lockout after 5 failures, refresh rotation, refresh reuse revokes the family, logout, `/store/me`, claiming a guest customer by phone, token isolation in both directions, `POST /store/orders` 401 without a token and success with one.
- Backend unit: password policy, common-password list.
- Storefront (`node --test`): auth reducer and persistence rules (access token never persisted), password-rule helper shared by the forms, 401-refresh decision helper. `tsc` and `vite build`.

## 7. Risks and recorded follow-ups

- Claiming a guest `Customer` by phone without verification: acceptable only because no history is exposed yet. Follow-up: SMS or M-Pesa verification before any order-history endpoint.
- Refresh token in `localStorage` is readable by injected script; mitigated by the CSP in sub-project 2 and by not persisting the access token.
- No email verification or password reset until a mail provider exists.
