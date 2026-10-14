import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, FastForward } from "@phosphor-icons/react";
import type { Product } from "../data/products";
import { Photo } from "./Photo";

export const wraps = [
  { id: "burgundy", name: "Burgundy", hex: "#6b1f2a", dark: "#4a1520" },
  { id: "forest", name: "Forest", hex: "#24493a", dark: "#17312a" },
  { id: "midnight", name: "Midnight", hex: "#1f2a44", dark: "#141b2f" },
  { id: "kraft", name: "Kraft", hex: "#a68460", dark: "#836445" },
];
export const ribbons = [
  { id: "gold", name: "Citron", hex: "#c6e24f" },
  { id: "cream", name: "Bone", hex: "#eceee8" },
  { id: "black", name: "Onyx", hex: "#1c1917" },
];

interface Props {
  product: Product | undefined;
  color?: string;
  wrap: string;
  ribbon: string;
  message: string;
  from: string;
  to: string;
  runKey: number;
}

const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

/** Confetti pieces, memoised so re-renders of the parent never restart the burst. */
const Confetti = memo(function Confetti({ run, count }: { run: number; count: number }) {
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

/**
 * Gift-box unwrap sequence. stage 0 closed, 1 ribbon released, 2 lid open, 3 reveal + card.
 * Only transform and opacity are animated.
 */
export const GiftUnwrap = memo(function GiftUnwrap({ product, wrap, ribbon, message, from, to, runKey }: Props) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(reduce ? 3 : 0);
  const [boom, setBoom] = useState(0);
  const w = wraps.find((x) => x.id === wrap) ?? wraps[0];
  const r = ribbons.find((x) => x.id === ribbon) ?? ribbons[0];

  useEffect(() => {
    if (reduce) {
      setStage(3);
      return;
    }
    setStage(0);
    const timers = [
      setTimeout(() => setStage(1), 900),
      setTimeout(() => setStage(2), 1700),
      setTimeout(() => {
        setStage(3);
        setBoom((b) => b + 1);
      }, 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [runKey, reduce, wrap, ribbon, product?.id]);

  const skip = () => {
    if (stage < 3) {
      setStage(3);
      setBoom((b) => b + 1);
    }
  };

  const spring = { type: "spring" as const, stiffness: 120, damping: 14 };
  const ribbonOff = stage >= 1;
  const lidOpen = stage >= 2;
  const revealed = stage >= 3;

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-[#1a1d1a] to-[#0d0f0d] text-white" style={{ minHeight: 480 }}>
      {/* light rays */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[46%] -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "conic-gradient(from 0deg, transparent, rgba(198,226,79,0.5), transparent 18%, rgba(198,226,79,0.4), transparent 38%, rgba(198,226,79,0.5), transparent 58%, rgba(198,226,79,0.35), transparent 78%)", maskImage: "radial-gradient(circle, #000 0%, transparent 68%)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 68%)" }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: lidOpen ? 1 : 0, scale: lidOpen ? 1 : 0.4, rotate: lidOpen && !reduce ? 360 : 0 }}
        transition={{ opacity: { duration: 0.6 }, scale: { duration: 0.8 }, rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
        aria-hidden
      />

      <div className="relative mx-auto mt-10 h-[310px] w-[280px] sm:w-[320px]">
        {/* shadow on floor */}
        <motion.div className="absolute -bottom-2 left-1/2 h-6 w-56 -translate-x-1/2 rounded-[50%] bg-black/55 blur-md" initial={{ scaleX: 0.5, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ ...spring, delay: 0.2 }} />

        <motion.div className="absolute inset-0" key={runKey} initial={{ y: -260, opacity: 0, rotate: -4 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 90, damping: 11, mass: 1.1 }}>
          {/* Product rising out */}
          <AnimatePresence>
            {product && (
              <motion.div
                className="absolute bottom-[96px] left-1/2 z-10 h-[220px] w-[190px] -translate-x-1/2"
                initial={{ y: 60, opacity: 0, scale: 0.7 }}
                animate={revealed ? { y: -78, opacity: 1, scale: 1.08, rotate: [0, -3, 2, 0] } : lidOpen ? { y: 0, opacity: 0.001, scale: 0.8 } : { y: 60, opacity: 0, scale: 0.7 }}
                transition={revealed ? { type: "spring", stiffness: 70, damping: 12, rotate: { duration: 2.2, ease: "easeInOut" } } : { duration: 0.2 }}
              >
                <span className="block h-full w-full border-[6px] border-[#eceee8] bg-[#eceee8] shadow-[0_16px_28px_rgba(0,0,0,0.5)]"><Photo id={product.images[0]} alt={product.name} w={400} eager className="h-full w-full" /></span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Box body */}
          <div className="absolute bottom-0 left-1/2 z-20 h-[128px] w-[250px] -translate-x-1/2 overflow-hidden rounded-b-xl shadow-[0_24px_40px_-12px_rgba(0,0,0,0.6)] sm:w-[280px]" style={{ background: `linear-gradient(180deg, ${w.hex}, ${w.dark})` }}>
            <div className="absolute inset-y-0 left-0 w-3 bg-black/15" />
            <div className="absolute inset-y-0 right-0 w-3 bg-black/25" />
            <motion.div className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2" style={{ background: `linear-gradient(90deg, ${r.hex}, ${r.hex}cc 45%, ${r.hex})`, boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)" }} animate={ribbonOff ? { y: 140, opacity: 0 } : { y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.5, 0, 0.8, 0.4] }} />
            <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/35 to-transparent" />
          </div>

          {/* Lid */}
          <motion.div
            className="absolute bottom-[116px] left-1/2 z-30 h-[44px] w-[272px] -translate-x-1/2 origin-bottom-left sm:w-[304px]"
            animate={lidOpen ? { y: -150, x: -64, rotate: -24, opacity: 0.95 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 80, damping: 12 }}
          >
            <div className="absolute inset-0 rounded-md shadow-[0_10px_18px_-6px_rgba(0,0,0,0.5)]" style={{ background: `linear-gradient(180deg, ${w.hex}, ${w.dark})`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 18px -6px rgba(0,0,0,0.5)" }} />
            <motion.div className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2" style={{ background: r.hex }} animate={ribbonOff ? { y: -80, opacity: 0 } : { y: 0, opacity: 1 }} transition={{ duration: 0.6 }} />
            {/* bow */}
            <motion.div className="absolute -top-7 left-1/2 -translate-x-1/2" animate={ribbonOff ? { y: -50, rotate: 25, opacity: 0, scale: 0.8 } : { y: 0, rotate: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: "easeIn" }}>
              <div className="relative h-8 w-24">
                <span className="absolute left-0 top-0 h-8 w-11 origin-right -rotate-[14deg] rounded-[60%_40%_40%_60%] border-2 border-black/10" style={{ background: r.hex }} />
                <span className="absolute right-0 top-0 h-8 w-11 origin-left rotate-[14deg] rounded-[40%_60%_60%_40%] border-2 border-black/10" style={{ background: r.hex }} />
                <span className="absolute left-1/2 top-2 size-5 -translate-x-1/2 rounded-md" style={{ background: r.hex, filter: "brightness(0.85)" }} />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        <Confetti run={boom} count={reduce ? 0 : 56} />
      </div>

      {/* Message card */}
      <div className="relative z-40 mx-auto mt-8 min-h-[120px] max-w-sm px-5 pb-16">
        <AnimatePresence>
          {revealed && (
            <motion.figure initial={{ opacity: 0, y: 30, rotateX: -50 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ type: "spring", stiffness: 90, damping: 14, delay: reduce ? 0 : 0.35 }} className="origin-top rounded-xl bg-[#eceee8] p-5 text-[#111311] shadow-[0_20px_30px_-12px_rgba(0,0,0,0.6)] [transform-style:preserve-3d]">
              <p className="display text-2xl leading-[1.1]">{message.trim() || "Wear it well."}</p>
              <figcaption className="mt-3 flex justify-between text-xs uppercase tracking-widest text-[#565b55]">
                <span>For {to.trim() || "you"}</span>
                <span>From {from.trim() || "a friend"}</span>
              </figcaption>
            </motion.figure>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute right-3 top-3 z-50 flex gap-2">
        {!revealed && (
          <button onClick={skip} className="inline-flex min-h-10 items-center gap-1.5 bg-white/10 px-4 text-xs font-medium backdrop-blur hover:bg-white/20">
            <FastForward size={14} weight="fill" /> Skip animation
          </button>
        )}
        {revealed && (
          <button onClick={() => { setStage(0); setTimeout(() => setStage(1), 700); setTimeout(() => setStage(2), 1400); setTimeout(() => { setStage(3); setBoom((b) => b + 1); }, 2000); }} className="inline-flex min-h-10 items-center gap-1.5 bg-white/10 px-4 text-xs font-medium backdrop-blur hover:bg-white/20">
            <ArrowCounterClockwise size={14} /> Replay
          </button>
        )}
      </div>
    </div>
  );
});
