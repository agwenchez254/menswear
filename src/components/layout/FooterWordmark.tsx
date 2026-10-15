/**
 * Large, faint logo at the foot of the page, in place of the old capitalised word. It spans the same width the
 * text did and is shown at low strength so it reads as a watermark. The light and dark artwork switch with the theme
 * (see .logo-light / .logo-dark in index.css). Static.
 */
export function FooterWordmark() {
  return (
    <div className="overflow-hidden px-4" aria-hidden>
      <div className="mx-auto w-[clamp(18rem,60vw,46rem)] select-none opacity-[0.22]">
        <img src="/brand/jabali-sassy-men-light.svg" alt="" width={548} height={288} className="logo-light h-auto w-full" />
        <img src="/brand/jabali-sassy-men-dark.svg" alt="" width={548} height={288} className="logo-dark h-auto w-full" />
      </div>
    </div>
  );
}
