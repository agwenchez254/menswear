import assert from "node:assert/strict";
import { test } from "node:test";
import { NAIROBI_SKYLINE, safeImageUrl, sized, srcSetFor, unsplash } from "./media.ts";

test("sized rewrites the width of Unsplash URLs", () => {
  assert.equal(sized("https://images.unsplash.com/photo-1?w=1600&q=75", 640), "https://images.unsplash.com/photo-1?w=640&q=75");
});

test("sized leaves other hosts untouched", () => {
  assert.equal(sized("http://localhost:5000/uploads/a.jpg", 640), "http://localhost:5000/uploads/a.jpg");
});

test("sized survives a malformed URL", () => {
  assert.equal(sized("not a url", 640), "not a url");
});

test("srcSetFor lists three widths for Unsplash", () => {
  const set = srcSetFor("https://images.unsplash.com/photo-1?w=900", 900);
  assert.match(set ?? "", /w=540 540w, .*w=900 900w, .*w=1800 1800w/);
});

test("srcSetFor is undefined for images that cannot be resized", () => {
  assert.equal(srcSetFor("http://localhost:5000/uploads/a.jpg", 900), undefined);
});

test("unsplash builds a photo URL", () => {
  assert.equal(unsplash("abc", 1600), "https://images.unsplash.com/photo-abc?w=1600&q=75&auto=format&fit=crop");
  assert.match(unsplash(NAIROBI_SKYLINE, 800), /^https:\/\/images\.unsplash\.com\/photo-/);
});

test("safeImageUrl allows https and rejects script and data URLs", () => {
  assert.equal(safeImageUrl("https://images.unsplash.com/photo-1"), "https://images.unsplash.com/photo-1");
  assert.equal(safeImageUrl("javascript:alert(1)"), null);
  assert.equal(safeImageUrl("data:image/svg+xml;base64,AAAA"), null);
  assert.equal(safeImageUrl("//evil.example/x.png"), null);
  assert.equal(safeImageUrl("not a url"), null);
  assert.equal(safeImageUrl(""), null);
});

test("safeImageUrl allows plain http only for localhost (development)", () => {
  assert.equal(safeImageUrl("http://localhost:5000/uploads/a.jpg"), "http://localhost:5000/uploads/a.jpg");
  assert.equal(safeImageUrl("http://evil.example/a.jpg"), null);
});
