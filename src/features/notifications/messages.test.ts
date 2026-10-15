import assert from "node:assert/strict";
import { test } from "node:test";
import { noticeFor, parseOrderEvent, type OrderEvent } from "./messages.ts";

const base: OrderEvent = { id: "e1", kind: "order.status", number: "JB-000009", status: "paid", total: 2250, method: "delivery", paymentMethod: "mpesa", at: 1 };

test("a new order says it is confirmed and what is still owed", () => {
  const n = noticeFor({ ...base, kind: "order.created", status: "pending" });
  assert.equal(n?.title, "Order placed");
  assert.match(n?.body ?? "", /KES 2,250/);
  assert.match(n?.body ?? "", /waiting for your payment/);
  assert.match(noticeFor({ ...base, kind: "order.created", paymentMethod: "cod" })?.body ?? "", /pay on delivery/);
});

test("each status has its own wording and tone", () => {
  assert.equal(noticeFor(base)?.title, "Payment received");
  assert.equal(noticeFor({ ...base, status: "shipped" })?.title, "On its way");
  assert.equal(noticeFor({ ...base, status: "cancelled" })?.tone, "alert");
});

test("a status with nothing to say gives no notice", () => {
  assert.equal(noticeFor({ ...base, status: "pending" }), null);
});

test("parseOrderEvent accepts a good event and rejects junk", () => {
  assert.equal(parseOrderEvent(JSON.stringify(base))?.number, "JB-000009");
  assert.equal(parseOrderEvent("not json"), null);
  assert.equal(parseOrderEvent(JSON.stringify({ ...base, kind: "other" })), null);
  assert.equal(parseOrderEvent(JSON.stringify({ id: "x" })), null);
});
