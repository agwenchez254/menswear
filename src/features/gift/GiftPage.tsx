import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Gift as GiftIcon } from "@phosphor-icons/react";
import { useGetProductQuery, useGetProductsQuery } from "@/api/catalogue";
import type { Product } from "@/models";
import { useGender } from "@/store/gender";
import { GiftUnwrap } from "@/features/gift/components/GiftUnwrap";
import { MAX_MESSAGE_LENGTH, RIBBONS, WRAPS } from "@/features/gift/constants";
import { Photo } from "@/components/ui/Photo";
import { useCart } from "@/store/cart";
import { formatKES } from "@/lib/format";
import { snapshotOf } from "@/lib/snapshot";
import { GIFT_FEE } from "@/config/commerce";

const NO_PRODUCTS: Product[] = [];

export default function GiftPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const gender = useGender((st) => st.gender);
  const defaultSlug = gender === "men" ? "oxford-button-down" : "denim-shirt-dress";

  const { currentData: pool = NO_PRODUCTS } = useGetProductsQuery(gender);
  const gifts = useMemo(() => pool.filter((p) => p.inStock && (p.category !== "accessories" || p.price >= 1800)), [pool]);

  const [slug, setSlug] = useState(params.get("product") ?? defaultSlug);
  const { data: product, isError } = useGetProductQuery(slug);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [wrap, setWrap] = useState("burgundy");
  const [ribbon, setRibbon] = useState("gold");
  const [message, setMessage] = useState("Happy birthday, baba. You always dress for the moment. Here is one more reason.");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [error, setError] = useState("");

  const pick = (next: string) => {
    setSlug(next);
    setRunKey((k) => k + 1);
  };

  // Choose a colour and size when a different product loads (not on every live refetch of the same one).
  useEffect(() => {
    if (!product) return;
    setColor(product.colors[0]?.name ?? "");
    setSize(product.sizes[Math.min(2, product.sizes.length - 1)] ?? "");
  }, [product?.id]);

  // When the shop switches between men and women, move to a gift from that side.
  useEffect(() => {
    if (product && product.gender !== gender) pick(defaultSlug);
  }, [gender, product?.gender]);

  // The wanted product does not exist (any more): fall back to the first available gift.
  useEffect(() => {
    if (isError && gifts[0] && gifts[0].slug !== slug) pick(gifts[0].slug);
  }, [isError, gifts]);

  const addGift = () => {
    if (!product) return;
    if (!to.trim() || !from.trim()) {
      setError("Add the recipient's name and yours so the card is personal.");
      return;
    }
    setError("");
    add({
      productId: product.id,
      size,
      color,
      snapshot: snapshotOf(product, product.colorImages[color]?.[0]),
      gift: { wrap, ribbon, message: message.trim(), from: from.trim(), to: to.trim() },
    });
    navigate("/checkout");
  };

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-10 md:px-8 md:pt-14" aria-busy={!isError}>
        <h1 className="mt-2 display text-5xl md:text-7xl">Build a gift worth opening.</h1>
        <div className="skeleton mt-12 h-[420px] w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-10 md:px-8 md:pt-14">
      <h1 className="mt-2 display text-5xl md:text-7xl">Build a gift worth opening.</h1>
      <p className="mt-5 max-w-[56ch] text-muted">Choose the piece, the wrapping and the words. Watch it unwrap on the right, exactly as they will see it.</p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_minmax(420px,520px)]">
        <div className="space-y-12">
          <section aria-labelledby="g1">
            <h2 id="g1" className="display text-3xl">
              <span className="mr-3 text-ink">1</span>Pick the gift
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {gifts.slice(0, 8).map((p) => (
                <button key={p.id} onClick={() => pick(p.slug)} aria-pressed={p.slug === slug} className={`tile relative overflow-hidden border-2 text-left transition ${p.slug === slug ? "border-ink" : "border-transparent"}`}>
                  <div className="aspect-square">
                    <Photo src={p.image} alt={p.name} w={300} className="h-full w-full" />
                  </div>
                  <div className="bg-surface p-2.5">
                    <p className="truncate text-xs font-medium">{p.name}</p>
                    <p className="text-xs text-muted tabular-nums">{formatKES(p.price)}</p>
                  </div>
                  {p.slug === slug && <span className="absolute right-2 top-2 grid size-6 place-items-center bg-accent text-accent-ink"><Check size={14} weight="bold" /></span>}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <fieldset>
                <legend className="label">Colour</legend>
                <div className="mt-2 flex gap-3">
                  {product.colors.map((c) => (
                    <button key={c.name} aria-label={c.name} aria-pressed={c.name === color} onClick={() => setColor(c.name)} className={`size-10 rounded-full border-2 ${c.name === color ? "border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: c.hex }} />
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label">Size</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button key={s} aria-pressed={s === size} onClick={() => setSize(s)} className={`min-h-10 min-w-11 rounded-lg border px-3 text-sm ${s === size ? "border-ink bg-ink text-on-ink" : "border-line bg-surface"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section aria-labelledby="g2">
            <h2 id="g2" className="display text-3xl">
              <span className="mr-3 text-ink">2</span>Choose the wrapping
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <fieldset>
                <legend className="label">Box</legend>
                <div className="mt-2 flex gap-3">
                  {WRAPS.map((w) => (
                    <button key={w.id} aria-label={w.name} aria-pressed={w.id === wrap} title={w.name} onClick={() => { setWrap(w.id); setRunKey((k) => k + 1); }} className={`size-12 rounded-xl border-2 ${w.id === wrap ? "border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: w.hex }} />
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label">Ribbon</legend>
                <div className="mt-2 flex gap-3">
                  {RIBBONS.map((r) => (
                    <button key={r.id} aria-label={r.name} aria-pressed={r.id === ribbon} title={r.name} onClick={() => { setRibbon(r.id); setRunKey((k) => k + 1); }} className={`size-12 rounded-xl border-2 ${r.id === ribbon ? "border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: r.hex }} />
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section aria-labelledby="g3">
            <h2 id="g3" className="display text-3xl">
              <span className="mr-3 text-ink">3</span>Write the card
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="to" className="label">To</label>
                <input id="to" className="field" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient's name" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="from" className="label">From</label>
                <input id="from" className="field" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label htmlFor="msg" className="label">Message</label>
                <textarea id="msg" rows={3} maxLength={MAX_MESSAGE_LENGTH} className="field py-3" value={message} onChange={(e) => setMessage(e.target.value)} />
                <p className="text-right text-xs text-muted tabular-nums">{message.length}/{MAX_MESSAGE_LENGTH}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">We hide prices on the packing slip. You can enter the recipient's address at checkout, or choose pickup.</p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <GiftUnwrap product={product} color={color} wrap={wrap} ribbon={ribbon} message={message} from={from} to={to} runKey={runKey} />
          <div className="mt-4 rounded-3xl bg-surface p-6 ring-1 ring-ink/15">
            <dl className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between"><dt className="text-muted">{product.name}</dt><dd>{formatKES(product.price)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Gift wrap and card</dt><dd>{formatKES(GIFT_FEE)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd>{formatKES(product.price + GIFT_FEE)}</dd></div>
            </dl>
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
            <button className="btn-accent mt-4 h-14 w-full text-base" onClick={addGift}>
              <GiftIcon size={20} /> Add gift to bag
            </button>
            <p className="mt-3 text-center text-xs text-muted">Wrapping is billed at checkout. <Link to="/shop" className="underline">Keep browsing</Link></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
