import { useState, type FormEvent } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { errorMessage } from "@/api/baseApi";
import { useLoginMutation, useRegisterMutation, useResendCodeMutation, type VerificationStarted } from "@/api/auth";
import { VerifyEmailModal } from "@/features/auth/VerifyEmailModal";
import { apiErrorCode } from "@/lib/otp";
import { Field } from "@/components/ui/Field";
import { normalizePhone } from "@/lib/phone";
import { validatePassword } from "@/lib/password";

type Mode = "signin" | "signup";
type Errors = Record<string, string>;
type Pending = VerificationStarted & { password: string };

interface AuthPanelProps {
  title?: string;
  onDone?: () => void;
}

/** Sign in or create an account. On success the session is stored by the API layer and `onDone` runs. */
export function AuthPanel({ title = "Sign in to continue", onDone }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [login, { isLoading: signingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const [resend] = useResendCodeMutation();
  const [pending, setPending] = useState<Pending | null>(null);
  const busy = signingIn || registering;

  const validate = (): Errors => {
    const e: Errors = {};
    if (mode === "signup" && name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email.";
    if (mode === "signup") {
      if (!normalizePhone(phone)) e.phone = "Enter a valid Kenyan number, like 0712 345 678.";
      const bad = validatePassword(password, email);
      if (bad) e.password = bad;
    } else if (!password) e.password = "Enter your password.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      if (mode === "signin") {
        await login({ email: email.trim(), password }).unwrap();
        setPassword("");
        onDone?.();
      } else {
        const started = await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password }).unwrap();
        setPending({ ...started, password });
      }
    } catch (err) {
      if (apiErrorCode(err) === "email_not_verified") {
        // The password was right but the account is still waiting for its code: send a fresh one and ask for it.
        const sent = await resend({ email: email.trim() }).unwrap().catch(() => null);
        setPending({ email: email.trim().toLowerCase(), password, expiresInSeconds: 600, resendAfterSeconds: sent?.resendAfterSeconds ?? 0 });
        return;
      }
      setFormError(errorMessage(err));
    }
  };

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setErrors({});
        setFormError("");
      }}
      className={`min-h-11 flex-1 border-b-2 px-4 text-sm font-semibold transition ${mode === m ? "border-ink" : "border-transparent text-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <section aria-labelledby="auth-title" className="mx-auto max-w-md px-4 py-16 md:py-24">
      <h1 id="auth-title" className="display text-4xl md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-muted">You need an account to check out. It takes a minute.</p>
      <div role="tablist" aria-label="Account" className="mt-8 flex border-b border-line">
        {tab("signin", "Sign in")}
        {tab("signup", "Create account")}
      </div>
      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        {mode === "signup" && (
          <Field label="Full name" htmlFor="auth-name" error={errors.name}>
            <input id="auth-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label="Email" htmlFor="auth-email" error={errors.email}>
          <input id="auth-email" type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {mode === "signup" && (
          <Field label="Phone" htmlFor="auth-phone" error={errors.phone} hint="Used for delivery and M-Pesa.">
            <input id="auth-phone" type="tel" className="field" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        )}
        <Field label="Password" htmlFor="auth-password" error={errors.password} hint={mode === "signup" ? "At least 12 characters. A short phrase works well." : undefined}>
          <input
            id="auth-password"
            type="password"
            className="field"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {formError && (
          <p role="alert" className="flex items-center gap-1 text-sm text-danger">
            <WarningCircle size={16} /> {formError}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-accent h-14 w-full text-base disabled:opacity-60">
          {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      {pending && (
        <VerifyEmailModal
          email={pending.email}
          password={pending.password}
          expiresInSeconds={pending.expiresInSeconds}
          resendAfterSeconds={pending.resendAfterSeconds}
          onClose={() => setPending(null)}
          onVerified={() => {
            setPending(null);
            setPassword("");
            onDone?.();
          }}
        />
      )}
    </section>
  );
}
