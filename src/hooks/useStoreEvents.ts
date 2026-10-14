import { useEffect } from "react";
import { API_URL, baseApi } from "@/api/baseApi";
import { parseInvalidate } from "@/api/events";
import { TAGS } from "@/api/tags";
import { useAppDispatch } from "@/store/hooks";

const EVENTS_URL = `${API_URL}/store/events`;

/**
 * Keeps the storefront live: one EventSource, each `invalidate` event refetches the affected queries.
 * A re-opened stream (auto-reconnect, or the tab becoming visible again) invalidates everything,
 * because events may have been missed in between. The stream is closed while the tab is hidden.
 */
export function useStoreEvents(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    let opened = false;

    const open = () => {
      if (source) return;
      const es = new EventSource(EVENTS_URL);
      es.addEventListener("open", () => {
        if (opened) dispatch(baseApi.util.invalidateTags([...TAGS]));
        opened = true;
      });
      es.addEventListener("invalidate", (e) => {
        const tags = parseInvalidate((e as MessageEvent<string>).data);
        if (tags.length) dispatch(baseApi.util.invalidateTags(tags));
      });
      source = es;
    };
    const close = () => {
      source?.close();
      source = null;
    };
    const onVisibility = () => (document.hidden ? close() : open());

    open();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      close();
    };
  }, [dispatch]);
}
