import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Notice } from "./messages";

const MAX = 30;

interface NoticeState {
  /** Newest first. Kept for the browser session, not on the server. */
  notices: Notice[];
  /** Ids of notices shown as a pop-up and not yet dismissed. */
  popups: string[];
  add: (n: Notice) => void;
  dismiss: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotices = create<NoticeState>()(
  persist(
    (set) => ({
      notices: [],
      popups: [],
      add: (n) =>
        set((s) => (s.notices.some((x) => x.id === n.id) ? s : { notices: [n, ...s.notices].slice(0, MAX), popups: [...s.popups, n.id].slice(-3) })),
      dismiss: (id) => set((s) => ({ popups: s.popups.filter((p) => p !== id) })),
      markAllRead: () => set((s) => ({ notices: s.notices.map((n) => (n.read ? n : { ...n, read: true })) })),
      clear: () => set({ notices: [], popups: [] }),
    }),
    { name: "jabali-notices", storage: createJSONStorage(() => sessionStorage), partialize: (s) => ({ notices: s.notices }) },
  ),
);
