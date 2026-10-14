import assert from "node:assert/strict";
import { test } from "node:test";
import { backoffMs, createLiveStream, type StreamSource } from "./liveStream.ts";

class FakeSource implements StreamSource {
  readyState = 0;
  closed = false;
  private handlers = new Map<string, ((e: { data?: unknown }) => void)[]>();
  addEventListener(type: string, cb: (e: { data?: unknown }) => void) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), cb]);
  }
  close() {
    this.closed = true;
    this.readyState = 2;
  }
  fire(type: string, data?: unknown) {
    for (const cb of this.handlers.get(type) ?? []) cb({ data });
  }
}

function setup() {
  const sources: FakeSource[] = [];
  const timers: { fn: () => void; ms: number; cleared: boolean }[] = [];
  const log = { invalidate: [] as string[], resync: 0 };
  const stream = createLiveStream({
    create: () => {
      const s = new FakeSource();
      sources.push(s);
      return s;
    },
    onInvalidate: (raw) => log.invalidate.push(raw),
    onResync: () => void (log.resync += 1),
    setTimer: (fn, ms) => {
      const t = { fn, ms, cleared: false };
      timers.push(t);
      return t;
    },
    clearTimer: (h) => void ((h as { cleared: boolean }).cleared = true),
  });
  return { stream, sources, timers, log };
}

test("backoffMs doubles from one second and caps at thirty", () => {
  assert.deepEqual([0, 1, 2, 3, 10].map(backoffMs), [1000, 2000, 4000, 8000, 30000]);
});

test("forwards invalidate payloads and does not resync on the first open", () => {
  const { stream, sources, log } = setup();
  stream.open();
  sources[0].fire("open");
  sources[0].fire("invalidate", '{"tags":["Home"]}');
  assert.deepEqual(log.invalidate, ['{"tags":["Home"]}']);
  assert.equal(log.resync, 0);
});

test("a permanently closed stream is reopened after a backoff and then resyncs", () => {
  const { stream, sources, timers, log } = setup();
  stream.open();
  sources[0].fire("open");
  sources[0].readyState = 2; // the browser gave up (e.g. a 502 from a proxy)
  sources[0].fire("error");
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, 1000);
  timers[0].fn();
  assert.equal(sources.length, 2);
  sources[1].fire("open");
  assert.equal(log.resync, 1);
});

test("an error while the browser is still retrying itself does not open a second stream", () => {
  const { stream, sources, timers } = setup();
  stream.open();
  sources[0].readyState = 0; // CONNECTING: the browser auto-reconnects
  sources[0].fire("error");
  assert.equal(timers.length, 0);
  assert.equal(sources.length, 1);
});

test("repeated failures back off further, and a successful open resets the delay", () => {
  const { stream, sources, timers } = setup();
  stream.open();
  sources[0].readyState = 2;
  sources[0].fire("error");
  timers[0].fn();
  sources[1].readyState = 2;
  sources[1].fire("error");
  assert.equal(timers[1].ms, 2000);
  timers[1].fn();
  sources[2].fire("open");
  sources[2].readyState = 2;
  sources[2].fire("error");
  assert.equal(timers[2].ms, 1000);
});

test("close cancels a pending reconnect and closes the source", () => {
  const { stream, sources, timers } = setup();
  stream.open();
  sources[0].readyState = 2;
  sources[0].fire("error");
  stream.close();
  assert.equal(timers[0].cleared, true);
  stream.open();
  assert.equal(sources.length, 2);
  stream.close();
  assert.equal(sources[1].closed, true);
});
