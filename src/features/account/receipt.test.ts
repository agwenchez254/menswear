import assert from "node:assert/strict";
import { test } from "node:test";
import type { MyOrder } from "../../models/order.ts";
import { ETIMS_NOTICE, parseTab, receiptModel, statusLabel } from "./receipt.ts";

const seller = { businessName: "Jabali Menswear Ltd", kraPin: "P051234567Z", address: "Moi Avenue, Nairobi" };

const order: MyOrder = {
  id: "JB-000012", status: "paid", placedAt: "2026-10-15T08:00:00Z",
  lines: [{ key: "l1", name: "Oxford", colour: "White", size: "42", qty: 2, unitPrice: 2500, lineTotal: 4500 }],
  subtotal: 5000, delivery: 250, discount: 500, total: 4750,
  method: "Delivery to Nairobi", paymentMethod: "mpesa", payment: "M-Pesa", paymentStatus: "paid",
  name: "Ann Wanjiku", email: "ann@example.com", phone: "+254712345678", payerPhone: null, contactName: null, contactPhone: null,
  address: "Kilimani", eta: "Next day", vat: { ratePercent: 16, amount: 655, net: 4095, seller },
  timeline: [],
};

test("a paid order is a Receipt, an unpaid one an order summary that says so", () => {
  assert.equal(receiptModel(order).heading, "Receipt");
  const unpaid = receiptModel({ ...order, paymentStatus: "pending", status: "pending" });
  assert.equal(unpaid.heading, "Order summary (unpaid)");
  assert.equal(receiptModel({ ...order, paymentStatus: "failed" }).heading, "Order summary (unpaid)");
});

test("cancelled and refunded orders carry a banner and never read as a plain receipt", () => {
  assert.equal(receiptModel({ ...order, status: "refunded", paymentStatus: "refunded" }).banner, "Refunded");
  assert.equal(receiptModel({ ...order, status: "cancelled", paymentStatus: "pending" }).banner, "Cancelled");
  assert.equal(receiptModel(order).banner, null);
  assert.notEqual(receiptModel({ ...order, status: "refunded", paymentStatus: "refunded" }).heading, "Receipt");
});

test("VAT and the seller details appear only when the order carries them", () => {
  const withVat = receiptModel(order);
  assert.deepEqual(withVat.seller, seller);
  assert.deepEqual(withVat.vat, { label: "VAT (16%) included", amount: 655, net: 4095 });
  const without = receiptModel({ ...order, vat: null });
  assert.equal(without.seller, null);
  assert.equal(without.vat, null);
  assert.equal(receiptModel({ ...order, vat: undefined }).vat, null);
});

test("a fractional rate prints without trailing zeros", () => {
  assert.equal(receiptModel({ ...order, vat: { ratePercent: 8.5, amount: 1, net: 1, seller } }).vat?.label, "VAT (8.5%) included");
  assert.equal(receiptModel({ ...order, vat: { ratePercent: 16.0, amount: 1, net: 1, seller } }).vat?.label, "VAT (16%) included");
});

test("every receipt says it is not a KRA eTIMS tax invoice", () => {
  assert.equal(receiptModel(order).notice, ETIMS_NOTICE);
  assert.match(ETIMS_NOTICE, /not a KRA eTIMS tax invoice/i);
  assert.equal(receiptModel({ ...order, vat: null }).notice, ETIMS_NOTICE);
});

test("parseTab reads the tab from the query string and falls back to profile", () => {
  assert.equal(parseTab("?tab=orders"), "orders");
  assert.equal(parseTab("?tab=profile"), "profile");
  assert.equal(parseTab(""), "profile");
  assert.equal(parseTab("?tab=admin"), "profile");
});

test("statusLabel gives readable names and tolerates unknown statuses", () => {
  assert.equal(statusLabel("pending"), "Pending");
  assert.equal(statusLabel("shipped"), "Shipped");
  assert.equal(statusLabel("weird_thing"), "Weird thing");
});
