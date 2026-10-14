import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/api/baseApi";
import auth from "./authSlice";
import { AUTH_STORAGE_KEY, toStored } from "./authPersist";

export const store = configureStore({
  reducer: { auth, [baseApi.reducerPath]: baseApi.reducer },
  middleware: (gdm) => gdm().concat(baseApi.middleware),
});

// Persist the session (never the access token) whenever it changes.
let lastStored: string | null = toStored(store.getState().auth);
store.subscribe(() => {
  const next = toStored(store.getState().auth);
  if (next === lastStored) return;
  lastStored = next;
  try {
    if (next) localStorage.setItem(AUTH_STORAGE_KEY, next);
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
