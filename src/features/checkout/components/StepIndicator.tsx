import { CheckCircle } from "@phosphor-icons/react";
import type { StepIndicatorProps } from "@/features/checkout/models";

export function StepIndicator({ step, steps }: StepIndicatorProps) {
  return (
    <ol className="mt-8 flex items-center gap-2 text-sm" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span className={`grid size-8 shrink-0 place-items-center text-xs font-semibold ${done ? "bg-mpesa text-paper" : active ? "bg-ink text-on-ink" : "bg-ink/10 text-muted"}`}>
              {done ? <CheckCircle size={18} weight="fill" /> : n}
            </span>
            <span className={`${active ? "font-medium" : "text-muted"} max-sm:hidden`}>{s}</span>
            {n < steps.length && <span className={`h-px flex-1 ${done ? "bg-mpesa" : "bg-line"}`} />}
          </li>
        );
      })}
      <li className="ml-2 text-xs text-muted sm:hidden">
        Step {step} of {steps.length}
      </li>
    </ol>
  );
}
