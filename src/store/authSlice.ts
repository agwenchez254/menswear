import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AUTH_STORAGE_KEY, EMPTY_AUTH, fromStored, type AuthState, type AuthUser } from "./authPersist.ts";

function initial(): AuthState {
  try {
    return typeof localStorage === "undefined" ? EMPTY_AUTH : fromStored(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return EMPTY_AUTH; // storage can be blocked
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: initial(),
  reducers: {
    sessionStarted(_s, a: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>) {
      return { user: a.payload.user, accessToken: a.payload.accessToken, refreshToken: a.payload.refreshToken };
    },
    tokensRotated(s, a: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      s.accessToken = a.payload.accessToken;
      s.refreshToken = a.payload.refreshToken;
    },
    userUpdated(s, a: PayloadAction<AuthUser>) {
      s.user = a.payload;
    },
    signedOut() {
      return EMPTY_AUTH;
    },
  },
});

export const { sessionStarted, tokensRotated, userUpdated, signedOut } = authSlice.actions;
export default authSlice.reducer;
