import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Gift as GiftIcon } from "@phosphor-icons/react";
import { byId, formatKES, products } from "../data/products";
import { GiftUnwrap, ribbons, wraps } from "../components/GiftUnwrap";
import { Photo } from "../components/Photo";
import { GIFT_FEE, useCart } from "../store/cart";

const MAX_MSG = 160;

export default function Gift() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const initial = byId(params.get("product") ?? "") ?? products.find((p) => p.id === "oxford-button-down")!;
  const [productId, setProductId] = useState(initial.id);
  const [color, setColor] = useState(initial.colors[0].name);
  const [size, setSize] = useState(initial.sizes[Math.min(2, initial.sizes.length - 1)]);
  const [wrap, setWrap] = useState("burgundy");
  const [ribbon, setRibbon] = useState("gold");
  const [message, setMessage] = useState("Happy birthday, baba. You always dress for the moment. Here is one more reason.");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [error, setError] = useState("");

  const product = byId(productId)!;
  const gifts = useMemo(() => products.filter((p) => p.category !== "accessories" || p.price >= 1800), []);

  const pick = (id: string) => {
    const p = byId(id)!;
    setProductId(id);
    setColor(p.colors[0].name);
    setSize(p.sizes[Math.min(2, p.sizes.length - 1)]);
    setRunKey((k) => k + 1);
  };

  const addGift = () => {
    if (!to.trim() || !from.trim()) {
      setError("Add the recipient's name and yours so the card is personal.");
      return;
    }
    setError("");
    add({ productId, size, color, gift: { wrap, ribbon, message: message.trim(), from: from.trim(), to: to.trim() } });
    navigate("/checkout");
  };

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col px-4 pb-10 pt-10 md:px-8 md:pt-14 lg:h-full lg:pb-4 lg:pt-4">
      <p className="">The gifting studio</p>
      <h1 className="mt-2 display text-5xl md:text-7xl lg:mt-0 lg:text-4xl">Build a gift worth opening.</h1>
      <p className="mt-5 max-w-[56ch] text-muted lg:hidden">Choose the piece, the wrapping and the words. Watch it unwrap on the right, exactly as they will see it.</p>

      <div className="mt-12 grid gap-10 lg:mt-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_minmax(340px,420px)] lg:gap-6">
        <div className="space-y-12 lg:min-h-0 lg:space-y-4 lg:overflow-hidden">
          <section aria-labelledby="g1">
            <h2 id="g1" className="display text-3xl lg:text-xl">
              <span className="mr-3 text-ink">1</span>Pick the gift
            </h2>
            <div className="-mx-4 mt-5 lg:mt-2 flex snap-x gap-3 overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-3 md:mx-0 md:px-0">
              {gifts.slice(0, 14).map((p) => (
                <button key={p.id} onClick={() => pick(p.id)} aria-pressed={p.id === productId} className={`relative w-32 shrink-0 lg:w-24 snap-start overflow-hidden rounded-2xl border-2 text-left transition ${p.id === productId ? "border-ink" : "border-transparent"}`}>
                  <div className="aspect-square">
                    <Photo id={p.images[0]} alt={p.name} w={300} className="h-full w-full" />
                  </div>
                  <div className="bg-surface p-2.5">
                    <p className="truncate text-xs font-medium">{p.name}</p>
                    <p className="text-xs text-muted tabular-nums">{formatKES(p.price)}</p>
                  </div>
                  {p.id === productId && <span className="absolute right-2 top-2 grid size-6 place-items-center bg-accent text-accent-ink"><Check size={14} weight="bold" /></span>}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:mt-2 lg:gap-3">
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
            <h2 id="g2" className="display text-3xl lg:text-xl">
              <span className="mr-3 text-ink">2</span>Choose the wrapping
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:mt-2 lg:gap-3">
              <fieldset>
                <legend className="label">Box</legend>
                <div className="mt-2 flex gap-3">
                  {wraps.map((w) => (
                    <button key={w.id} aria-label={w.name} aria-pressed={w.id === wrap} title={w.name} onClick={() => { setWrap(w.id); setRunKey((k) => k + 1); }} className={`size-12 rounded-xl border-2 ${w.id === wrap ? "border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: w.hex }} />
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label">Ribbon</legend>
                <div className="mt-2 flex gap-3">
                  {ribbons.map((r) => (
                    <button key={r.id} aria-label={r.name} aria-pressed={r.id === ribbon} title={r.name} onClick={() => { setRibbon(r.id); setRunKey((k) => k + 1); }} className={`size-12 rounded-xl border-2 ${r.id === ribbon ? "border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: r.hex }} />
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section aria-labelledby="g3">
            <h2 id="g3" className="display text-3xl lg:text-xl">
              <span className="mr-3 text-ink">3</span>Write the card
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:mt-2 lg:gap-3">
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
                <textarea id="msg" rows={2} maxLength={MAX_MSG} className="field py-3" value={message} onChange={(e) => setMessage(e.target.value)} />
                <p className="text-right text-xs text-muted tabular-nums">{message.length}/{MAX_MSG}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted lg:hidden">We hide prices on the packing slip. You can enter the recipient's address at checkout, or choose pickup.</p>
          </section>
        </div>

        <aside className="lg:min-h-0 lg:overflow-hidden">
          <GiftUnwrap product={product} color={color} wrap={wrap} ribbon={ribbon} message={message} from={from} to={to} runKey={runKey} />
          <div className="mt-4 rounded-3xl bg-surface p-6 lg:mt-3 lg:p-4 ring-1 ring-ink/15">
            <dl className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between"><dt className="text-muted">{product.name}</dt><dd>{formatKES(product.price)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Gift wrap and card</dt><dd>{formatKES(GIFT_FEE)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd>{formatKES(product.price + GIFT_FEE)}</dd></div>
            </dl>
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
            <button className="btn-accent mt-4 h-14 lg:mt-3 lg:h-12 w-full text-base" onClick={addGift}>
              <GiftIcon size={20} /> Add gift to bag
            </button>
            <p className="mt-3 text-center text-xs text-muted lg:hidden">Wrapping is billed at checkout. <Link to="/shop" className="underline">Keep browsing</Link></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
