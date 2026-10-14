# Transactional email: design

Date: 2026-10-14
Repos: `jabali-be` (everything below), `gift-shoe-app` (docs only).
Sub-project 3 of 3. Builds on `2026-10-14-customer-auth-design.md` (register flow) and the existing checkout (`POST /store/orders`).

## Goal

The backend can really send email, and sends two messages: a **welcome / onboarding** email when a customer creates an account, and an **order confirmation with the receipt in the message body** when an order is placed.

## Decisions

- **Transport:** SMTP through `nodemailer`. It is supplier-neutral: the same code talks to a local Mailpit, SES SMTP, SendGrid, Zoho or Gmail app-password SMTP, chosen only by `SMTP_URL`. No provider account is assumed.
- **Receipt in the body, not an attachment.** HTML with a plain-text alternative. A PDF attachment would add a PDF dependency and a second template for little gain; it is a recorded follow-up if you want a printable file.
- **Never block or fail a request because of mail.** Sending is fire-and-forget with 3 attempts (immediately, after 2 s, after 10 s); failures are logged (recipient masked, body never logged).
- **Templates are TypeScript functions** (no template engine dependency) with a shared inline-CSS layout in the Jabali colours. Every interpolated value is HTML-escaped; subjects have CR/LF stripped; links point only at the configured `STORE_URL`.
- **When SMTP is not configured:** development and test use a logging transport (nothing leaves the machine; the outbox is inspectable). **Production refuses to start without `SMTP_URL`**, so mail can never silently not send.
- **Local verification:** a Mailpit container (SMTP 1025, web UI 8025) is added to `docker-compose.yml`.

## Messages

1. **Welcome** (sent after `POST /store/auth/register` succeeds): greets by first name, three onboarding steps (browse, pay with M-Pesa or on delivery in Nairobi, delivery times), a "Start shopping" button, and a note that the account email is the sign-in email. No password or token is ever included.
2. **Order confirmation and receipt** (sent after an order is created, not on an idempotent replay): order number and date (Africa/Nairobi time), itemised lines (name, colour, size, quantity, unit price, line total), subtotal, discount, delivery fee, total in KES, payment method and what happens next (M-Pesa/Airtel prompt and the 30-minute hold, pay on delivery, card), delivery address or pickup address with the delivery estimate, and a "Continue shopping" link. Sent to the account email.

## Configuration (`jabali-be`)

`SMTP_URL` (`smtp://user:pass@host:587` or `smtps://...`; empty means the logging transport), `MAIL_FROM` (default `Jabali <no-reply@jabali.co.ke>`), `MAIL_REPLY_TO` (optional), `STORE_URL` (default `http://localhost:5173`; must be https in production). In production, TLS is required for `smtp://` connections (`requireTLS`).

## Out of scope

Email verification and password reset (the transport now exists, so these become small follow-ups), a PDF receipt attachment, order status emails (paid, shipped, delivered), unsubscribe handling (transactional messages only), a persistent outbox with retries across restarts.

## Honest limits

- **The storefront checkout still simulates orders locally**, so the order email fires only for orders created through the backend API. It will fire from the storefront once real order placement is wired (the separate follow-up). The welcome email fires today, from real registrations.
- Retries live in memory: a crash during the 12 s retry window loses that email. A database-backed outbox is the fix if delivery guarantees matter.
- The welcome email goes to an address that is not yet verified; because duplicate emails are rejected, any one address can receive it at most once.

## Testing

- Unit: template output (escaping of hostile names and addresses, all amounts and lines present, delivery vs pickup, payment wording, plain-text parity, subject sanitising), `MailService` retry and give-up behaviour with a fake transport, invalid recipients skipped, config validation.
- Integration over the real SMTP wire protocol: an in-process SMTP server (`smtp-server`) receives the message and `mailparser` checks From, To, Subject, and both the HTML and text parts.
- E2E: registering delivers the welcome email to that server; registering still succeeds (201) when the SMTP server is unreachable.
- Manual: send through the Mailpit container and read the message in its UI.

## Amendments made during implementation (2026-10-14)

- Three messages, not two: a **verification code** email (sent at sign-up and on resend), the **welcome** email (sent when the code is confirmed and the account becomes active, redesigned with a hero band and the four Jabali promises), and the **order confirmation with the receipt in the body**.
- `MAIL_FROM`, `MAIL_REPLY_TO`, `SMTP_URL` and `STORE_URL` are documented in `jabali-be/docs/email.md`; `.env.example` was deliberately not edited (it had unrelated staged changes).
- Verified against a real SMTP server: automated tests use an in-process SMTP server (`smtp-server`), and all three emails were also delivered to a Mailpit container and inspected in a browser.
