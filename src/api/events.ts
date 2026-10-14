import { TAGS, type StoreTag } from "./tags.ts";

/** Tags from an SSE `invalidate` payload. Anything malformed or unknown is ignored. */
export function parseInvalidate(raw: string): StoreTag[] {
  try {
    const data = JSON.parse(raw) as { tags?: unknown };
    if (!Array.isArray(data.tags)) return [];
    return data.tags.filter((t): t is StoreTag => typeof t === "string" && (TAGS as readonly string[]).includes(t));
  } catch {
    return [];
  }
}
