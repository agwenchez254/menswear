/** Large, faint wordmark at the foot of the page. Static. */
export function FooterWordmark() {
  return (
    <div className="overflow-hidden" aria-hidden>
      <p className="display select-none whitespace-nowrap px-4 text-center text-[clamp(5rem,23vw,21rem)] uppercase leading-[0.8] text-ink/[0.07]">Jabali</p>
    </div>
  );
}
