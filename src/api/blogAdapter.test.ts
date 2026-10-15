import assert from "node:assert/strict";
import { test } from "node:test";
import { safeHref, toDoc, toPost } from "./blogAdapter.ts";

test("safeHref allows http(s) and site paths only", () => {
  assert.equal(safeHref("https://x.co/a"), "https://x.co/a");
  assert.equal(safeHref("/shop"), "/shop");
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("//evil.co"), null);
  assert.equal(safeHref(5), null);
});

test("toDoc keeps supported nodes, emoji included, and drops the rest", () => {
  const doc = toDoc({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 3, textAlign: "center" }, content: [{ type: "text", text: "Hi 🎉" }] },
      { type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "bold" }, { type: "link", attrs: { href: "javascript:x" } }, { type: "weird" }] }] },
      { type: "image", attrs: { src: "javascript:alert(1)" } },
      { type: "image", attrs: { src: "https://x/a.jpg", alt: "A" } },
      { type: "iframe" },
    ],
  });
  assert.deepEqual(doc, [
    { type: "heading", level: 3, align: "center", content: [{ type: "text", text: "Hi 🎉", marks: [] }] },
    { type: "paragraph", align: undefined, content: [{ type: "text", text: "a", marks: [{ type: "bold" }] }] },
    { type: "image", src: "https://x/a.jpg", alt: "A" },
  ]);
});

test("toDoc and toPost cope with junk", () => {
  assert.deepEqual(toDoc("<p>x</p>"), []);
  const p = toPost({ id: "1", slug: "s", title: "T", excerpt: "E", coverUrl: "javascript:x", thumbnailUrl: "javascript:y", publishedAt: null, content: null });
  assert.equal(p.coverUrl, null);
  assert.equal(p.thumbnailUrl, null);
  assert.deepEqual(p.content, []);
});
