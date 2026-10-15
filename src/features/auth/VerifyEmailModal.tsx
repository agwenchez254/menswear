import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { EnvelopeSimple, WarningCircle, X } from "@phosphor-icons/react";
import { errorMessage } from "@/api/baseApi";
import { useResendCodeMutation, useVerifyEmailMutation } from "@/api/auth";
import { cleanCode, formatCountdown, isCompleteCode, OTP_LENGTH, verifyErrorMessage } from "@/lib/otp";

interface VerifyEmailModalProps {
  email: string;
  /** The sign-up password. Activation needs it with the code; it stays in memory only. */
  password: string;
  expiresInSeconds: number;
  /** Seconds before a new code may be requested. */
  resendAfterSeconds: number;
  onClose: () => void;
  /** Runs after the code is accepted and the session has started. */
  onVerified?: () => void;
}

/** Asks for the 6-digit code emailed at sign-up. A correct code activates the account and signs the customer in. */
export function VerifyEmailModal({ email, password, expiresInSeconds, resendAfterSeconds, onClose, onVerified }: VerifyEmailModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(resendAfterSeconds);
  const input = useRef<HTMLInputElement>(null);
  const [verify, { isLoading: verifying }] = useVerifyEmailMutation();
  const [resend, { isLoading: resending }] = useResendCodeMutation();

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!isCompleteCode(code)) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setError("");
    setNotice("");
    try {
      await verify({ email, code, password }).unwrap();
      onVerified?.();
    } catch (err) {
      setError(verifyErrorMessage(err, errorMessage(err)));
      setCode("");
      input.current?.focus();
    }
  };

  const sendAgain = async () => {
    setError("");
    setNotice("");
    try {
      const r = await resend({ email }).unwrap();
      setCooldown(r.resendAfterSeconds);
      setCode("");
      setNotice("A new code is on its way.");
      input.current?.focus();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-end sm:place-items-center">
      <motion.div className="absolute inset-0 bg-ink/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} aria-hidden="true" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-title"
        aria-describedby="verify-desc"
        className="relative w-full max-w-md bg-paper p-6 shadow-2xl sm:rounded-2xl sm:p-8"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-11 place-items-center text-muted hover:text-ink">
          <X size={20} />
        </button>
        <span className="grid size-12 place-items-center rounded-xl bg-ink/5">
          <EnvelopeSimple size={26} />
        </span>
        <h2 id="verify-title" className="display mt-5 text-3xl">
          Verify your email
        </h2>
        <p id="verify-desc" className="mt-2 text-sm text-muted">
          We sent a {OTP_LENGTH}-digit code to <strong className="break-all text-ink">{email}</strong>. It expires in {Math.round(expiresInSeconds / 60)} minutes.
        </p>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="verify-code" className="label">
              Verification code
            </label>
            <input
              ref={input}
              id="verify-code"
              className={`field text-center text-2xl tracking-[0.5em] ${error ? "field-error" : ""}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d*"
              maxLength={OTP_LENGTH + 4}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(cleanCode(e.target.value))}
              aria-invalid={!!error}
              aria-describedby={error ? "verify-err" : undefined}
            />
          </div>
          {error && (
            <p id="verify-err" role="alert" className="flex items-center gap-1 text-sm text-danger">
              <WarningCircle size={16} /> {error}
            </p>
          )}
          {notice && !error && (
            <p role="status" className="text-sm text-muted">
              {notice}
            </p>
          )}
          <button type="submit" disabled={verifying || !isCompleteCode(code)} className="btn-accent h-14 w-full text-base disabled:opacity-60">
            {verifying ? "Verifying..." : "Verify and continue"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Did not get it?{" "}
          <button type="button" onClick={sendAgain} disabled={cooldown > 0 || resending} className="font-semibold text-ink underline disabled:no-underline disabled:opacity-60">
            {resending ? "Sending..." : cooldown > 0 ? `Resend in ${formatCountdown(cooldown)}` : "Send a new code"}
          </button>
        </p>
      </motion.div>
    </div>,
    document.body,
  );
}
