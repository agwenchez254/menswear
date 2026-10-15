import assert from "node:assert/strict";
import { test } from "node:test";
import { variantIdFor } from "./variant.ts";

const v = (id: string, colourName: string | null, size: string) => ({ id, colourName, size, available: 1, inStock: true });

test("variantIdFor matches colour and size", () => {
  const variants = [v("a", "Blue", "M"), v("b", "Red", "M"), v("c", "Blue", "L")];
  assert.equal(variantIdFor(variants, "Red", "M"), "b");
  assert.equal(variantIdFor(variants, "Blue", "L"), "c");
});

test("variantIdFor falls back to a colour-less variant and returns null when nothing fits", () => {
  const variants = [v("a", null, "M"), v("b", "Blue", "L")];
  assert.equal(variantIdFor(variants, "Red", "M"), "a");
  assert.equal(variantIdFor(variants, "Red", "XL"), null);
});
