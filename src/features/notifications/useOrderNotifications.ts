import { useEffect, useRef } from "react";
import { API_URL, baseApi } from "@/api/baseApi";
import { authApi } from "@/api/auth";
import { playChime } from "@/lib/chime";
import { runEventStream } from "@/lib/sse";
import { signedFetch } from "@/lib/signedFetch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { noticeFor, parseOrderEvent } from "./messages";
import { useNotices } from "./store";

const URL = `${API_URL}/store/me/notifications`;

/**
 * While a customer is signed in, listens for live updates about their own orders: each one adds a notice, plays a
 * sound, and refreshes any order status already on screen. Signing out closes the stream and clears the notices.
 */
export function useOrderNotifications(): void {
  const dispatch = useAppDispatch();
  const signedIn = useAppSelector((s) => !!s.auth.accessToken);
  const token = useAppSelector((s) => s.auth.accessToken);
  const latest = useRef<string | null>(token);
  latest.current = token;

  useEffect(() => {
    if (!signedIn) {
      useNotices.getState().clear();
      return;
    }
    const ctl = new AbortController();
    void runEventStream({
      url: URL,
      fetchFn: signedFetch,
      signal: ctl.signal,
      token: () => latest.current,
      // An expired access token: asking for the profile makes the API layer rotate it, and the loop reconnects with the new one.
      onUnauthorized: () => void dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })),
      onMessage: (m) => {
        if (m.event !== "order") return;
        const e = parseOrderEvent(m.data);
        if (!e) return;
        dispatch(baseApi.util.invalidateTags(["OrderStatus"]));
        const n = noticeFor(e);
        if (!n) return;
        useNotices.getState().add(n);
        playChime(n.tone);
      },
    });
    return () => ctl.abort();
  }, [signedIn, dispatch]);
}
