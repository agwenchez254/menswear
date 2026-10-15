import assert from "node:assert/strict";
import { test } from "node:test";
import { colourStock, firstAvailableSize, reconcileSelection, sizeSoldOut } from "./stock.ts";

const v = (colourName: string | null, size: string, available: number) => ({ id: `${colourName}-${size}`, colourName, size, available, inStock: available > 0 });
const product = (variants: ReturnType<typeof v>[], colors = ["Blue", "Red"], sizes = ["S", "M", "L"]) => ({
  colors: colors.map((name) => ({ name })),
  sizes,
  variants,
});

test("colourStock sums the colour's variants plus colour-less ones", () => {
  const variants = [v("Blue", "S", 2), v("Blue", "M", 3), v("Red", "S", 9), v(null, "L", 1)];
  assert.equal(colourStock(variants, "Blue"), 6);
  assert.equal(colourStock(variants, "Red"), 10);
});

test("sizeSoldOut is true when out of stock or not offered, false when in stock", () => {
  const variants = [v("Blue", "S", 0), v("Blue", "M", 2)];
  assert.equal(sizeSoldOut(variants, "Blue", "S"), true);
  assert.equal(sizeSoldOut(variants, "Blue", "M"), false);
  assert.equal(sizeSoldOut(variants, "Blue", "XL"), true);
});

test("reconcileSelection keeps a still-valid selection", () => {
  const p = product([v("Blue", "M", 2), v("Red", "M", 2)]);
  assert.deepEqual(reconcileSelection(p, "Blue", "M"), { color: "Blue", size: "M" });
});

test("reconcileSelection falls back to the first colour when the chosen one was removed", () => {
  const p = product([v("Red", "M", 2)], ["Red"]);
  assert.deepEqual(reconcileSelection(p, "Blue", "M"), { color: "Red", size: "M" });
});

test("reconcileSelection clears a size that sold out", () => {
  const p = product([v("Blue", "M", 0), v("Blue", "L", 2)]);
  assert.deepEqual(reconcileSelection(p, "Blue", "M"), { color: "Blue", size: "" });
});

test("reconcileSelection clears the size when the colour change makes it unavailable", () => {
  const p = product([v("Blue", "M", 2), v("Red", "L", 2)], ["Red"]);
  assert.deepEqual(reconcileSelection(p, "Blue", "M"), { color: "Red", size: "" });
});

test("reconcileSelection copes with a product that has no colours or variants", () => {
  assert.deepEqual(reconcileSelection(product([], [], []), "Blue", "M"), { color: "", size: "" });
});

test("firstAvailableSize prefers the third size, else the first one in stock, else empty", () => {
  const p = product([v("Blue", "S", 1), v("Blue", "M", 1), v("Blue", "L", 1)]);
  assert.equal(firstAvailableSize(p, "Blue"), "L");
  const soldOutThird = product([v("Blue", "S", 1), v("Blue", "M", 1), v("Blue", "L", 0)]);
  assert.equal(firstAvailableSize(soldOutThird, "Blue"), "S");
  assert.equal(firstAvailableSize(product([v("Blue", "S", 0)]), "Blue"), "");
});
