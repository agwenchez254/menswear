import { motion } from "motion/react";
import { useGender } from "@/store/gender";
import type { GenderToggleProps } from "@/models";

/** Men / Women switch. The sliding highlight is a shared layout element, so it glides between the two. */
export function GenderToggle({ compact, id = "gender-pill" }: GenderToggleProps) {
  const { gender, pending, request } = useGender();
  const active = pending ?? gender;
  return (
    <div role="radiogroup" aria-label="Shop for" className="relative flex bg-surface-2 p-0.5 [border-radius:var(--r-btn)]">
      {(["men", "women"] as const).map((g) => (
        <button
          key={g}
          role="radio"
          aria-checked={active === g}
          onClick={() => request(g)}
          className={`relative min-h-9 px-3 text-sm font-semibold transition-colors [border-radius:var(--r-btn)] sm:px-4 ${compact ? "min-w-[58px]" : "min-w-[76px]"} ${active === g ? "text-on-ink" : "text-ink"}`}
        >
          {active === g && (
            <motion.span layoutId={id} className="absolute inset-0 bg-ink [border-radius:var(--r-btn)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
          )}
          <span className="relative">{g === "men" ? "Men" : "Women"}</span>
        </button>
      ))}
    </div>
  );
}
