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
