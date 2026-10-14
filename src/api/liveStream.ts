/** The slice of EventSource the stream needs, so it can be tested without a browser. */
export interface StreamSource {
  readyState: number;
  addEventListener(type: string, cb: (e: { data?: unknown }) => void): void;
  close(): void;
}

export interface LiveStreamOptions {
  create: () => StreamSource;
  /** Raw `data` of an `invalidate` event. */
  onInvalidate: (raw: string) => void;
  /** The stream re-opened after being lost: events may have been missed, refetch everything. */
  onResync: () => void;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

const CLOSED = 2; // EventSource.CLOSED

/** 1s, 2s, 4s ... capped at 30s. */
export const backoffMs = (attempt: number): number => Math.min(30_000, 1000 * 2 ** attempt);

/**
 * One live stream. The browser retries by itself after a network drop, but gives up for good (readyState
 * CLOSED) when the server answers with an error or a wrong content type, e.g. a 502 while the backend
 * restarts. In that case we reopen it ourselves with a growing delay.
 */
export function createLiveStream(o: LiveStreamOptions): { open: () => void; close: () => void } {
  const setTimer = o.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = o.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  let source: StreamSource | null = null;
  let timer: unknown = null;
  let opened = false;
  let failures = 0;

  const open = (): void => {
    if (source) return;
    const es = o.create();
    es.addEventListener("open", () => {
      if (opened) o.onResync();
      opened = true;
      failures = 0;
    });
    es.addEventListener("invalidate", (e) => o.onInvalidate(String(e.data ?? "")));
    es.addEventListener("error", () => {
      if (es.readyState !== CLOSED || source !== es) return;
      source = null;
      timer = setTimer(() => {
        timer = null;
        open();
      }, backoffMs(failures++));
    });
    source = es;
  };

  const close = (): void => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    source?.close();
    source = null;
  };

  return { open, close };
}
