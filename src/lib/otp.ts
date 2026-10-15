export const OTP_LENGTH = 6;

/** Keeps only the digits, capped at the code length. Handles pasted codes like "123 456". */
export function cleanCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export const isCompleteCode = (code: string): boolean => code.length === OTP_LENGTH;

interface ProblemBody {
  code?: unknown;
  remainingAttempts?: unknown;
}

const bodyOf = (err: unknown): ProblemBody => ((err as { data?: ProblemBody } | undefined)?.data ?? {}) as ProblemBody;

/** The backend's machine-readable error code (problem+json `code`), if any. */
export const apiErrorCode = (err: unknown): string | undefined => {
  const c = bodyOf(err).code;
  return typeof c === "string" ? c : undefined;
};

/** Message for a failed verification, using the attempts left when the server reports them. */
export function verifyErrorMessage(err: unknown, fallback: string): string {
  const code = apiErrorCode(err);
  if (code === "invalid_code") {
    const left = bodyOf(err).remainingAttempts;
    return typeof left === "number" ? `That code is not right. ${left} ${left === 1 ? "attempt" : "attempts"} left.` : "That code is not right.";
  }
  return fallback;
}

/** "1:05" style countdown. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
