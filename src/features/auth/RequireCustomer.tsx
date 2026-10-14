import type { ReactNode } from "react";
import { useGetMeQuery } from "@/api/auth";
import { AuthPanel } from "@/features/auth/AuthPanel";
import { useAppSelector } from "@/store/hooks";

/**
 * Shows `children` only to a signed-in customer; everyone else gets the sign-in panel in place.
 * The stored session is validated once with `/store/me`, so a revoked session returns to the panel.
 * The bag lives in its own store and is untouched by signing in or out.
 */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const signedIn = useAppSelector((s) => !!s.auth.user && !!s.auth.refreshToken);
  const me = useGetMeQuery(undefined, { skip: !signedIn });

  if (!signedIn) return <AuthPanel />;
  if (me.isLoading) return <div className="min-h-[60dvh]" aria-busy="true" />;
  return <>{children}</>;
}
