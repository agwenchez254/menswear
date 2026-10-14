import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePassword } from "./password.ts";

test("accepts a long passphrase", () => {
  assert.equal(validatePassword("correct horse battery staple", "a@x.co"), null);
});

test("rejects short, over-long, repeated and email-derived passwords", () => {
  assert.match(validatePassword("short", "a@x.co") ?? "", /at least 12/);
  assert.match(validatePassword("x1".repeat(100), "a@x.co") ?? "", /at most 128/);
  assert.match(validatePassword("z".repeat(14), "a@x.co") ?? "", /too easy/);
  assert.match(validatePassword("Amina.Said@Example.com", "amina.said@example.com") ?? "", /email/);
});
