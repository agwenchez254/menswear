import { useState } from "react";
import { errorMessage } from "@/api/baseApi";
import { useLogoutMutation, useUpdateMeMutation } from "@/api/auth";
import { useAppSelector } from "@/store/hooks";

export function ProfileTab() {
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [logout, { isLoading: signingOut }] = useLogoutMutation();
  const [update, { isLoading: saving }] = useUpdateMeMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  if (!user) return null;

  const save = async () => {
    const next = name.trim();
    if (next.length < 2) return setError("Enter your full name.");
    try {
      await update({ name: next }).unwrap();
      setError("");
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div>
      <dl className="divide-y divide-line border-y border-line">
        <div className="flex items-center justify-between gap-4 py-4">
          <dt className="text-muted">Name</dt>
          {editing ? (
            <dd className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <label className="sr-only" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                className="field h-11 min-h-11 max-w-64 flex-1"
                value={name}
                maxLength={120}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void save()}
              />
              <button className="btn-dark h-11 min-h-11 px-5" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                className="btn-ghost h-11 min-h-11 px-5"
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
              >
                Cancel
              </button>
            </dd>
          ) : (
            <dd className="flex items-center gap-4 font-medium">
              {user.name}
              <button
                className="text-sm font-normal underline underline-offset-4"
                onClick={() => {
                  setName(user.name);
                  setEditing(true);
                }}
              >
                Edit
              </button>
            </dd>
          )}
        </div>
        <div className="flex justify-between gap-4 py-4">
          <dt className="text-muted">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4 py-4">
          <dt className="text-muted">Phone</dt>
          <dd className="font-medium">{user.phone}</dd>
        </div>
      </dl>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button className="btn-dark mt-8" disabled={signingOut} onClick={() => void logout(refreshToken ?? "")}>
        Sign out
      </button>
    </div>
  );
}
