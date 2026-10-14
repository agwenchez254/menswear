import { useLogoutMutation } from "@/api/auth";
import { useAppSelector } from "@/store/hooks";

export default function AccountPage() {
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [logout, { isLoading }] = useLogoutMutation();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 md:py-24">
      <h1 className="display text-4xl md:text-5xl">Your account</h1>
      <dl className="mt-8 divide-y divide-line border-y border-line">
        {(
          [
            ["Name", user.name],
            ["Email", user.email],
            ["Phone", user.phone],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-4">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <button className="btn-dark mt-8" disabled={isLoading} onClick={() => void logout(refreshToken ?? "")}>
        Sign out
      </button>
    </div>
  );
}
