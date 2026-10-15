import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryCounts, filterFaqs, highlightParts, type FaqItem } from "./faqLogic.ts";

const items: FaqItem[] = [
  { id: "a", category: "orders", question: "How do I place an order?", answer: "Add items to your bag and check out." },
  { id: "b", category: "payment", question: "How does M-Pesa work?", answer: "We send a prompt to your phone. Approve it with your PIN." },
  { id: "c", category: "payment", question: "Can I pay on delivery?", answer: "In selected areas." },
  { id: "d", category: "delivery", question: "Can I collect my order?", answer: "Yes, choose Studio pickup." },
];

test("with no filter every question is shown, in order", () => {
  assert.deepEqual(filterFaqs(items, "all", "").map((i) => i.id), ["a", "b", "c", "d"]);
});

test("a category keeps only its own questions", () => {
  assert.deepEqual(filterFaqs(items, "payment", "").map((i) => i.id), ["b", "c"]);
});

test("search matches the question or the answer, ignoring case and extra spaces", () => {
  assert.deepEqual(filterFaqs(items, "all", "  mpesa ").map((i) => i.id), []);
  assert.deepEqual(filterFaqs(items, "all", "m-pesa").map((i) => i.id), ["b"]);
  assert.deepEqual(filterFaqs(items, "all", "PIN").map((i) => i.id), ["b"]);
  assert.deepEqual(filterFaqs(items, "all", "studio   pickup").map((i) => i.id), ["d"]);
});

test("every word must match, in any order", () => {
  assert.deepEqual(filterFaqs(items, "all", "order collect").map((i) => i.id), ["d"]);
  assert.deepEqual(filterFaqs(items, "all", "collect banana").map((i) => i.id), []);
});

test("search and category combine", () => {
  assert.deepEqual(filterFaqs(items, "payment", "can").map((i) => i.id), ["c"]);
  assert.deepEqual(filterFaqs(items, "orders", "can").map((i) => i.id), []);
});

test("category counts ignore the selected category but follow the search", () => {
  assert.deepEqual(categoryCounts(items, ""), { all: 4, orders: 1, payment: 2, delivery: 1 });
  assert.deepEqual(categoryCounts(items, "order"), { all: 2, orders: 1, delivery: 1 });
});

test("highlightParts splits text around matches without losing a character", () => {
  const parts = highlightParts("How does M-Pesa work? Pesa!", "pesa");
  assert.equal(parts.map((p) => p.text).join(""), "How does M-Pesa work? Pesa!");
  assert.deepEqual(parts.filter((p) => p.hit).map((p) => p.text), ["Pesa", "Pesa"]);
  assert.deepEqual(highlightParts("Plain text", ""), [{ text: "Plain text", hit: false }]);
  assert.deepEqual(highlightParts("a.b (c)", "(c)"), [{ text: "a.b ", hit: false }, { text: "(c)", hit: true }]);
});
