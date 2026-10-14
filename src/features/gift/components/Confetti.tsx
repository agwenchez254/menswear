import { memo, useMemo } from "react";
import { motion } from "motion/react";
import type { ConfettiProps } from "@/features/gift/models";

const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

/** Confetti pieces, memoised so re-renders of the parent never restart the burst. */
export const Confetti = memo(function Confetti({ run, count }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = rand(i + 1) * Math.PI * 2;
        const dist = 90 + rand(i + 40) * 170;
        return {
          x: Math.cos(a) * dist,
          up: -Math.abs(Math.sin(a)) * dist - 30,
          fall: 120 + rand(i + 9) * 120,
          rot: (rand(i + 70) - 0.5) * 720,
          w: 5 + rand(i + 3) * 7,
          h: 8 + rand(i + 5) * 9,
          c: ["#c6e24f", "#eceee8", "#a5c42a", "#1d201d", "#7bb661"][i % 5],
          d: rand(i + 11) * 0.18,
          round: i % 3 === 0,
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-[44%] z-30" aria-hidden key={run}>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ width: p.w, height: p.round ? p.w : p.h, background: p.c, borderRadius: p.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.up, p.up + p.fall], opacity: [1, 1, 0], rotate: p.rot, scale: 1 }}
          transition={{ duration: 1.9, delay: p.d, ease: [0.22, 0.8, 0.4, 1], times: [0, 0.38, 1] }}
        />
      ))}
    </div>
  );
});
