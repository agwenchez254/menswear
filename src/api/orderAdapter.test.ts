import assert from "node:assert/strict";
import { test } from "node:test";
import { toMyOrder, toOrder, toOrderSummary, toPaymentStatus, type ApiMyOrder, type ApiOrder } from "./orderAdapter.ts";

const base: ApiOrder = {
  id: "uuid", number: "JB-000012", status: "pending", method: "delivery", paymentMethod: "mpesa",
  subtotal: 5000, discount: 500, deliveryFee: 250, total: 4750, county: "Nairobi", address: "Kilimani, Argwings Kodhek Rd",
  eta: "Next day", createdAt: "2026-10-15T08:00:00Z", customer: { name: "Ann", phone: "+254712345678" },
  lines: [
    { id: "l1", name: "Oxford", colour: "White", size: "M", qty: 2, lineTotal: 4500, gift: null },
    { id: "l2", name: "Tee", colour: "Black", size: "L", qty: 1, lineTotal: 500, gift: { to: "Joy" } },
  ],
  payments: [{ status: "failed" }, { status: "pending" }],
};

test("toOrder maps the backend order and uses the latest payment status", () => {
  const o = toOrder(base);
  assert.equal(o.id, "JB-000012");
  assert.equal(o.method, "Delivery to Nairobi");
  assert.equal(o.payment, "M-Pesa");
  assert.equal(o.paymentStatus, "pending");
  assert.equal(o.delivery, 250);
  assert.deepEqual(o.lines.map((l) => l.giftTo), [undefined, "Joy"]);
});

test("toOrder describes pickup orders and tolerates missing fields", () => {
  const o = toOrder({ ...base, method: "pickup", county: null, eta: null, payments: [], paymentMethod: "cod" });
  assert.equal(o.method, "Studio pickup");
  assert.equal(o.eta, "Ready for pickup in 2 hours");
  assert.equal(o.paymentStatus, "pending");
  assert.equal(o.payment, "Pay on delivery");
});

test("toPaymentStatus falls back to pending for unknown values", () => {
  assert.equal(toPaymentStatus("paid"), "paid");
  assert.equal(toPaymentStatus("weird"), "pending");
});

const seller = { businessName: "Jabali Menswear Ltd", kraPin: "P051234567Z", address: "Moi Avenue, Nairobi" };

test("toOrder keeps the VAT fixed at checkout, and none when the order had no VAT", () => {
  assert.equal(toOrder(base).vat, null);
  const o = toOrder({ ...base, vat: { ratePercent: 16, amount: 655, net: 4095, seller } });
  assert.deepEqual(o.vat, { ratePercent: 16, amount: 655, net: 4095, seller });
});

test("toOrderSummary maps a list row with a readable payment and delivery label", () => {
  const s = toOrderSummary({ number: "JB-000012", status: "shipped", paymentStatus: "paid", method: "pickup", paymentMethod: "cod", total: 4750, lineCount: 3, createdAt: "2026-10-15T08:00:00Z" });
  assert.deepEqual(s, { number: "JB-000012", status: "shipped", paymentStatus: "paid", method: "Studio pickup", payment: "Pay on delivery", total: 4750, lineCount: 3, placedAt: "2026-10-15T08:00:00Z" });
  assert.equal(toOrderSummary({ number: "JB-1", status: "pending", paymentStatus: "odd", method: "delivery", paymentMethod: "mpesa", total: 1, lineCount: 1, createdAt: "x" }).paymentStatus, "pending");
});

const detail: ApiMyOrder = {
  number: "JB-000012", status: "paid", method: "delivery", paymentMethod: "mpesa", paymentStatus: "paid", createdAt: "2026-10-15T08:00:00Z",
  eta: "Next day", county: "Nairobi", address: "Kilimani", notes: null, contactName: "Joy", contactPhone: "+254700000001",
  subtotal: 5000, discount: 500, deliveryFee: 250, total: 4750, vat: { ratePercent: 16, amount: 655, net: 4095, seller },
  customer: { name: "Ann", email: "ann@example.com", phone: "+254712345678" },
  lines: [{ id: "l1", name: "Oxford", colour: "White", size: "M", qty: 2, unitPrice: 2500, discount: 500, lineTotal: 4500, giftTo: undefined }],
  payments: [{ provider: "mpesa", status: "paid", amount: 4750, payerPhone: "+254712345678", createdAt: "2026-10-15T08:01:00Z" }],
  timeline: [{ type: "created", at: "2026-10-15T08:00:00Z" }, { type: "paid", at: "2026-10-15T08:02:00Z" }],
};

test("toMyOrder gives the order page and receipt everything: lines with unit prices, VAT, status and timeline", () => {
  const o = toMyOrder(detail);
  assert.equal(o.id, "JB-000012");
  assert.equal(o.status, "paid");
  assert.equal(o.email, "ann@example.com");
  assert.equal(o.name, "Ann");
  assert.equal(o.paymentStatus, "paid");
  assert.equal(o.payment, "M-Pesa");
  assert.equal(o.method, "Delivery to Nairobi");
  assert.deepEqual(o.lines.map((l) => [l.name, l.qty, l.unitPrice, l.lineTotal]), [["Oxford", 2, 2500, 4500]]);
  assert.equal(o.vat?.amount, 655);
  assert.equal(o.vat?.seller.kraPin, "P051234567Z");
  assert.deepEqual(o.timeline.map((t) => t.type), ["created", "paid"]);
  assert.equal(toMyOrder({ ...detail, vat: null }).vat, null);
});
