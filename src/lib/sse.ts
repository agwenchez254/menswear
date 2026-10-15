/** Server-sent events read with fetch, so the request can carry an Authorization header (EventSource cannot). */

export interface SseMessage {
  event: string;
  data: string;
  id?: string;
}

/** Feed it text as it arrives; it calls `onMessage` once per complete event. Comments and partial events are held back. */
export function createSseParser(onMessage: (m: SseMessage) => void): (chunk: string) => void {
  let buffer = "";
  return (chunk) => {
    buffer += chunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    let end: number;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      let event = "message";
      let id: string | undefined;
      const data: string[] = [];
      for (const line of block.split("\n")) {
        if (!line || line.startsWith(":")) continue;
        const i = line.indexOf(":");
        const field = i < 0 ? line : line.slice(0, i);
        const value = i < 0 ? "" : line.slice(i + 1).replace(/^ /, "");
        if (field === "event") event = value;
        else if (field === "data") data.push(value);
        else if (field === "id") id = value;
      }
      if (data.length || event !== "message") onMessage({ event, data: data.join("\n"), id });
    }
  };
}

/** 1s, 2s, 4s ... capped at 30s. */
export const backoffMs = (attempt: number): number => Math.min(30_000, 1000 * 2 ** attempt);

export interface StreamOptions {
  url: string;
  /** Called before every (re)connection, so a refreshed token is picked up. Null = do not connect. */
  token: () => string | null;
  onMessage: (m: SseMessage) => void;
  /** The server rejected the token (401). The caller should refresh it; the loop retries afterwards. */
  onUnauthorized?: () => void;
  signal: AbortSignal;
  /** The request function. Pass the signing one in the app; defaults to plain fetch. */
  fetchFn?: typeof fetch;
}

/** Keeps one stream open until `signal` aborts, reconnecting with a growing delay after errors. */
export async function runEventStream(o: StreamOptions): Promise<void> {
  let failures = 0;
  while (!o.signal.aborted) {
    const token = o.token();
    if (token) {
      try {
        const res = await (o.fetchFn ?? fetch)(o.url, { headers: { authorization: `Bearer ${token}`, accept: "text/event-stream" }, signal: o.signal });
        if (res.status === 401) o.onUnauthorized?.();
        else if (res.ok && res.body) {
          failures = 0;
          const parse = createSseParser(o.onMessage);
          const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            parse(value);
          }
        }
      } catch {
        if (o.signal.aborted) return;
      }
    }
    if (o.signal.aborted) return;
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, backoffMs(failures++));
      o.signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
    });
  }
}
