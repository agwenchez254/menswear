import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useGender } from "../store/gender";

const look = {
  men: { bg: "#111311", fg: "#c6e24f", font: '"Bricolage Grotesque Variable", sans-serif', weight: 700, label: "Men" },
  women: { bg: "#f29a76", fg: "#231a22", font: '"Outfit Variable", sans-serif', weight: 500, label: "Women" },
} as const;

/**
 * Full-screen wipe that covers the page, swaps the theme underneath, then lifts away.
 * Motivated: it tells the shopper the whole store (palette, shapes, catalogue) just changed.
 */
export function GenderCurtain() {
  const { pending, commit, clearPending } = useGender();
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState<"in" | "out">("in");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const settle = (target: "men" | "women") => {
    commit(target);
    if (pathname.startsWith("/shop")) navigate("/shop", { replace: true });
    else if (pathname.startsWith("/product")) navigate("/");
  };

  useEffect(() => {
    if (!pending) return;
    if (reduce) {
      settle(pending);
      clearPending();
      return;
    }
    setPhase("in");
    const t = timers.current;
    t.push(setTimeout(() => settle(pending), 620));
    t.push(setTimeout(() => setPhase("out"), 900));
    t.push(setTimeout(() => clearPending(), 1550));
    return () => {
      t.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (!pending || reduce) return null;
  const l = look[pending];

  return (
    <motion.div
      aria-hidden
      className="pointer-events-auto fixed inset-0 z-[90] grid place-items-center"
      style={{ background: l.bg, color: l.fg }}
      initial={{ y: "100%" }}
      animate={{ y: phase === "in" ? "0%" : "-100%" }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.span
        style={{ fontFamily: l.font, fontWeight: l.weight, letterSpacing: "-0.04em" }}
        className="text-[clamp(4rem,18vw,14rem)] leading-none"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: phase === "in" ? 0 : -40, opacity: phase === "in" ? 1 : 0 }}
        transition={{ duration: 0.45, delay: phase === "in" ? 0.25 : 0 }}
      >
        {l.label}
      </motion.span>
    </motion.div>
  );
}
