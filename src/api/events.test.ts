import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInvalidate } from "./events.ts";

test("returns the known tags", () => {
  assert.deepEqual(parseInvalidate('{"tags":["Home","Product"]}'), ["Home", "Product"]);
});

test("drops unknown or non-string tags", () => {
  assert.deepEqual(parseInvalidate('{"tags":["Home","Nope",3,null]}'), ["Home"]);
});

test("malformed payloads yield no tags", () => {
  for (const raw of ["", "not json", "null", "{}", "[]", '{"tags":"Home"}', '{"tags":{"a":1}}']) {
    assert.deepEqual(parseInvalidate(raw), [], raw);
  }
});
