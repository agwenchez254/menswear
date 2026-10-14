import { useEffect } from "react";
import { API_URL, baseApi } from "@/api/baseApi";
import { parseInvalidate } from "@/api/events";
import { createLiveStream } from "@/api/liveStream";
import { TAGS } from "@/api/tags";
import { useAppDispatch } from "@/store/hooks";

const EVENTS_URL = `${API_URL}/store/events`;

/**
 * Keeps the storefront live: one EventSource, each `invalidate` event refetches the affected queries.
 * A re-opened stream (auto-reconnect, our own reconnect after the browser gave up, or the tab becoming
 * visible again) invalidates everything, because events may have been missed in between. The stream is
 * closed while the tab is hidden.
 */
export function useStoreEvents(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const stream = createLiveStream({
      create: () => new EventSource(EVENTS_URL),
      onInvalidate: (raw) => {
        const tags = parseInvalidate(raw);
        if (tags.length) dispatch(baseApi.util.invalidateTags(tags));
      },
      onResync: () => void dispatch(baseApi.util.invalidateTags([...TAGS])),
    });
    const onVisibility = () => (document.hidden ? stream.close() : stream.open());

    stream.open();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stream.close();
    };
  }, [dispatch]);
}
