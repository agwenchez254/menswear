import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInline, parseMessage, safeHref } from "./chatText.ts";

test("safeHref allows site paths and http(s) only", () => {
  assert.equal(safeHref("/product/oxford"), "/product/oxford");
  assert.equal(safeHref("https://wa.me/254792551291"), "https://wa.me/254792551291");
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("//evil.co"), null);
  assert.equal(safeHref("data:text/html,x"), null);
});

test("parseInline finds bold and links and keeps the words of unsafe links", () => {
  assert.deepEqual(parseInline("A **bold** [shop](/shop) and [bad](javascript:x) end"), [
    { kind: "text", text: "A " },
    { kind: "bold", text: "bold" },
    { kind: "text", text: " " },
    { kind: "link", text: "shop", href: "/shop" },
    { kind: "text", text: " and " },
    { kind: "text", text: "bad" },
    { kind: "text", text: " end" },
  ]);
});

test("parseMessage groups bullets into one list and never emits markup", () => {
  const blocks = parseMessage("Options:\n- **Nairobi**: KES 250\n- Other: KES 650\n\n<script>alert(1)</script>");
  assert.equal(blocks.length, 3);
  assert.equal(blocks[1].kind, "list");
  if (blocks[1].kind === "list") assert.equal(blocks[1].items.length, 2);
  // angle brackets stay as plain text: React draws them as text, not as an element
  assert.deepEqual(blocks[2], { kind: "paragraph", inline: [{ kind: "text", text: "<script>alert(1)</script>" }] });
});
