import { WarningCircle } from "@phosphor-icons/react";
import type { FieldProps } from "@/models";

/** Labelled form field: label above, helper text below, and an inline error that replaces the helper. */
export function Field({ label, error, hint, children, htmlFor }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} role="alert" className="flex items-center gap-1 text-sm text-danger">
          <WarningCircle size={16} /> {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}
