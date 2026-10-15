import assert from "node:assert/strict";
import { test } from "node:test";
import { toPage } from "./pageAdapter.ts";

test("toPage keeps drawable blocks and drops malformed or unsafe ones", () => {
  const p = toPage({
    slug: "help",
    title: "Help",
    blocks: [
      { type: "heading", text: "Delivery" },
      { type: "paragraph", text: "" },
      { type: "list", items: ["a", 3, "b"] },
      { type: "image", url: "javascript:alert(1)", alt: "x" },
      { type: "image", url: "https://x/a.jpg", alt: "a" },
      { type: "button", label: "Shop", href: "javascript:alert(1)" },
      { type: "button", label: "Shop", href: "/shop" },
      { type: "mystery" },
      null,
    ],
  });
  assert.deepEqual(p.blocks, [
    { type: "heading", text: "Delivery" },
    { type: "list", items: ["a", "b"] },
    { type: "image", url: "https://x/a.jpg", alt: "a" },
    { type: "button", label: "Shop", href: "/shop" },
  ]);
});

test("toPage copes with non-array blocks", () => {
  assert.deepEqual(toPage({ slug: "s", title: "T", blocks: null }).blocks, []);
});
