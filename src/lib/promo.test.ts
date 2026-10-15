import assert from "node:assert/strict";
import { test } from "node:test";
import { promoReasonMessage } from "./promo.ts";

test("promoReasonMessage explains known reasons and falls back for others", () => {
  assert.equal(promoReasonMessage("expired"), "That code has expired.");
  assert.equal(promoReasonMessage("min_subtotal_not_met"), "Your bag is below the minimum for that code.");
  assert.equal(promoReasonMessage(undefined), "That code cannot be used.");
  assert.equal(promoReasonMessage("something_new"), "That code cannot be used.");
});
