import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

/** Thin accent line at the top of the viewport that fills as you read down the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-accent"
      style={{ scaleX }}
    />
  );
}

/** Fade and rise once when scrolled into view. */
export function Reveal({ children, delay = 0, y = 24, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Headline whose lines slide up from behind a mask as they enter the viewport. */
export function LinesReveal({ lines, className, as: Tag = "h2" }: { lines: ReactNode[]; className?: string; as?: "h1" | "h2" | "h3" }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag];
  return (
    <MotionTag className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} transition={{ staggerChildren: 0.1 }}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.1em]">
          <motion.span className="block" variants={{ hidden: { y: reduce ? 0 : "108%" }, show: { y: 0 } }} transition={spring}>
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/** Highlight that wipes in from the left behind a word. Watches the wrapper, since a scaled-to-zero element is never "in view". */
export function Wipe({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  return (
    <span ref={ref} className="relative inline-block whitespace-nowrap">
      <motion.span
        aria-hidden
        className="absolute inset-0 origin-left bg-accent [border-radius:var(--r-soft)]"
        initial={false}
        animate={{ scaleX: reduce || seen ? 1 : 0 }}
        transition={{ duration: 0.7, delay: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="relative px-[0.12em] text-accent-ink">{children}</span>
    </span>
  );
}

/** Pulls its child a few pixels toward the cursor. Pointer devices only. Uses motion values, never state. */
export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 });

  const move = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div ref={ref} className={`inline-block ${className ?? ""}`} style={{ x, y }} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </motion.div>
  );
}

/** Fills its (relative) parent and drifts the child against the scroll, for depth. */
export function Parallax({ children, amount = 8, className = "" }: { children: ReactNode; amount?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-amount}%`, `${amount}%`]);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div className="h-full w-full" style={reduce ? undefined : { y, scale: 1 + amount / 40 }}>
        {children}
      </motion.div>
    </div>
  );
}

/** Zooms its (relative) parent's image out as the section scrolls through the viewport. */
export function ZoomOut({ children, from = 1.18, className = "" }: { children: ReactNode; from?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [from, 1]);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div className="h-full w-full" style={reduce ? undefined : { scale }}>
        {children}
      </motion.div>
    </div>
  );
}

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/**
 * Text band that drifts on its own and speeds up (and reverses) with scroll velocity,
 * so the page feels like it responds to how fast you move.
 */
export function VelocityMarquee({ items, baseSpeed = 3 }: { items: { label: string; to: string }[]; baseSpeed?: number }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 5], { clamp: false });
  const dir = useRef(1);
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * baseSpeed * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * move * f;
    baseX.set(baseX.get() + move);
  });

  const row = (k: number) =>
    items.map((t, i) => (
      <span key={`${k}-${i}`} className="flex shrink-0 items-center gap-10">
        <Link to={t.to} tabIndex={k === 0 ? 0 : -1} className="transition-colors hover:text-accent">
          {t.label}
        </Link>
        <span aria-hidden className="size-2 bg-accent" />
      </span>
    ));

  return (
    <nav className="overflow-hidden border-y border-ink/15 py-5" aria-label="Browse by category">
      <motion.div className="display flex w-max gap-10 whitespace-nowrap text-[clamp(1.6rem,3.4vw,2.8rem)]" style={{ x }}>
        {row(0)}
        {row(1)}
        {row(2)}
        {row(3)}
      </motion.div>
    </nav>
  );
}
