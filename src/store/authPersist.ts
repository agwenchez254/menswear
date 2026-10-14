export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export const AUTH_STORAGE_KEY = "jabali-customer-auth";
export const EMPTY_AUTH: AuthState = { user: null, accessToken: null, refreshToken: null };

/** Only the user and the refresh token are persisted. The access token lives in memory so injected script cannot read it from storage. */
export function toStored(s: AuthState): string | null {
  if (!s.user || !s.refreshToken) return null;
  return JSON.stringify({ user: s.user, refreshToken: s.refreshToken });
}

const isUser = (v: unknown): v is AuthUser => {
  const u = v as Record<string, unknown> | null;
  return !!u && ["id", "name", "email", "phone"].every((k) => typeof u[k] === "string");
};

/** Restores a persisted session. Anything malformed means signed out. */
export function fromStored(raw: string | null): AuthState {
  try {
    const data = JSON.parse(raw ?? "") as { user?: unknown; refreshToken?: unknown } | null;
    if (data && isUser(data.user) && typeof data.refreshToken === "string" && data.refreshToken) {
      return { user: data.user, accessToken: null, refreshToken: data.refreshToken };
    }
  } catch {
    /* fall through */
  }
  return EMPTY_AUTH;
}
