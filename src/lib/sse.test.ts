import assert from "node:assert/strict";
import { test } from "node:test";
import { backoffMs, createSseParser, type SseMessage } from "./sse.ts";

const collect = () => {
  const got: SseMessage[] = [];
  return { got, feed: createSseParser((m) => got.push(m)) };
};

test("the parser emits one message per blank-line-terminated event", () => {
  const { got, feed } = collect();
  feed('event: order\nid: 7\ndata: {"a":1}\n\n');
  assert.deepEqual(got, [{ event: "order", id: "7", data: '{"a":1}' }]);
});

test("the parser handles events split across chunks and CRLF line endings", () => {
  const { got, feed } = collect();
  feed("event: order\r\ndata: he");
  assert.equal(got.length, 0);
  feed("llo\r\n\r\n");
  assert.deepEqual(got, [{ event: "order", id: undefined, data: "hello" }]);
});

test("the parser joins multi-line data, skips comments and defaults the event name", () => {
  const { got, feed } = collect();
  feed(": keep-alive\n\ndata: a\ndata: b\n\n");
  assert.deepEqual(got, [{ event: "message", id: undefined, data: "a\nb" }]);
});

test("a ping with empty data still arrives as an event", () => {
  const { got, feed } = collect();
  feed("event: ping\ndata: \n\n");
  assert.deepEqual(got, [{ event: "ping", id: undefined, data: "" }]);
});

test("backoff grows and is capped", () => {
  assert.equal(backoffMs(0), 1000);
  assert.equal(backoffMs(3), 8000);
  assert.equal(backoffMs(20), 30_000);
});
