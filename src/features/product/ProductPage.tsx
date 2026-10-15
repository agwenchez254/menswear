import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { CaretRight, Check, Gift, Package, Ruler, Star, Truck } from "@phosphor-icons/react";
import { isNotFound } from "@/api/baseApi";
import { useGetProductQuery, useGetProductsQuery } from "@/api/catalogue";
import { useCart } from "@/store/cart";
import { ProductGallery } from "@/features/product/components/ProductGallery";
import { SizeGuide } from "@/features/product/components/SizeGuide";
import { LOW_STOCK_AT } from "@/features/product/constants";
import { ProductCard } from "@/components/product/ProductCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatKES } from "@/lib/format";
import { snapshotOf } from "@/lib/snapshot";
import { colourStock, reconcileSelection, sizeSoldOut } from "@/lib/stock";

export default function ProductPage() {
  const { slug = "" } = useParams();
  // currentData so moving between products shows the skeleton instead of the previous product.
  const { currentData: product, isError, error, refetch } = useGetProductQuery(slug);
  const { currentData: pool } = useGetProductsQuery(product?.gender ?? skipToken);
  const add = useCart((s) => s.add);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [needSize, setNeedSize] = useState(false);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);

  // Reset the selection only when a different product loads. A live refetch of the same product
  // (the editor changed a price) must not throw away the visitor's colour and size.
  useEffect(() => {
    setColor(product?.colors[0]?.name ?? "");
    setSize(product?.sizes.length === 1 ? product.sizes[0] : "");
    setNeedSize(false);
    window.scrollTo({ top: 0 });
  }, [product?.id]);

  // A live refetch can remove the chosen colour or sell the chosen size out: re-check the selection.
  useEffect(() => {
    if (!product) return;
    const next = reconcileSelection(product, color, size);
    if (next.color !== color) setColor(next.color);
    if (next.size !== size) setSize(next.size);
  }, [product]);

  if (!product) {
    if (isError && !isNotFound(error)) return <ErrorState title="We could not load this product" onRetry={() => void refetch()} />;
    if (isError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-32 text-center">
          <h1 className="display text-5xl">We could not find that product</h1>
          <p className="mt-3 text-muted">It may have sold out or moved.</p>
          <Link to="/shop" className="btn-dark mt-8">
            Back to the shop
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 md:px-8" aria-busy="true">
        <div className="skeleton mt-6 aspect-[5/4] w-full lg:w-[55%]" />
      </div>
    );
  }

  const related = (pool ?? []).filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const stock = colourStock(product.variants, color);
  const soldOut = (s: string) => sizeSoldOut(product.variants, color, s);
  const low = stock > 0 && stock <= LOW_STOCK_AT;
  // Out when nothing is left at all, or nothing in the colour being looked at.
  const out = !product.inStock || stock === 0;
  const imgs = product.colorImages[color]?.length ? product.colorImages[color] : product.images;

  const addToBag = () => {
    if (out) return;
    if (!size || soldOut(size)) {
      setNeedSize(true);
      return;
    }
    add({ productId: product.id, size, color, snapshot: snapshotOf(product, imgs[0]) });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 md:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
        <Link to="/" className="hover:text-ink">Home</Link>
        <CaretRight size={12} />
        <Link to={`/shop?cat=${product.category}`} className="hover:text-ink">{product.categoryLabel}</Link>
        <CaretRight size={12} />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ProductGallery product={product} color={color} images={imgs} soldOut={out} />

        <div className="lg:sticky lg:top-32 lg:self-start">
          <h1 className="mt-2 display text-5xl md:text-6xl">{product.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Star size={16} weight="fill" className="text-ink" /> {product.rating.toFixed(1)} · {product.sold} sold
          </p>
          <p className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">{formatKES(product.price)}</span>
            {product.compareAt && <span className="text-lg text-muted line-through tabular-nums">{formatKES(product.compareAt)}</span>}
          </p>
          {product.blurb && <p className="mt-5 max-w-[56ch] leading-relaxed text-muted">{product.blurb}</p>}

          <fieldset className="mt-8">
            <legend className="label">
              Colour: <span className="font-normal text-muted">{color}</span>
            </legend>
            <div className="mt-3 flex gap-3">
              {product.colors.map((c) => (
                <button key={c.name} aria-label={c.name} aria-pressed={c.name === color} onClick={() => setColor(c.name)} className={`size-11 rounded-full border-2 transition ${c.name === color ? "border-ink ring-2 ring-accent" : "border-white ring-1 ring-ink/15"}`} style={{ background: c.hex }} />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <div className="flex items-center justify-between">
              <legend className="label">Size</legend>
              <button className="inline-flex items-center gap-1 text-sm underline underline-offset-4" onClick={() => setGuide((g) => !g)} aria-expanded={guide}>
                <Ruler size={16} /> Size guide
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const out = soldOut(s);
                return (
                  <button key={s} disabled={out} aria-pressed={size === s} onClick={() => { setSize(s); setNeedSize(false); }} className={`min-h-11 min-w-12 rounded-xl border px-4 text-sm transition disabled:cursor-not-allowed disabled:text-muted disabled:line-through disabled:opacity-50 ${size === s ? "border-ink bg-ink text-on-ink" : "border-line bg-surface hover:border-ink"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {needSize && (
              <p role="alert" className="mt-2 text-sm text-danger">
                Please choose a size first.
              </p>
            )}
            {guide && <SizeGuide gender={product.gender} />}
          </fieldset>

          {low && <p className="mt-5 text-sm font-medium text-danger">Only {stock} left in stock</p>}
          {out && <p className="mt-5 text-sm font-medium text-danger">{product.inStock ? `Sold out in ${color}. Try another colour.` : "Sold out"}</p>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="btn-accent h-14 flex-1 text-base disabled:cursor-not-allowed disabled:opacity-50" disabled={out} onClick={addToBag}>
              {out ? "Sold out" : added ? (<><Check size={20} weight="bold" /> Added to bag</>) : "Add to bag"}
            </button>
            <Link to={`/gift?product=${product.slug}`} className={`btn-ghost h-14 text-base ${out ? "pointer-events-none opacity-50" : ""}`} aria-disabled={out} tabIndex={out ? -1 : undefined}>
              <Gift size={20} /> Send as a gift
            </Link>
          </div>

          <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
            <li className="flex items-start gap-3 py-4"><Truck size={22} className="mt-0.5 text-ink" /><span><strong className="font-medium">Nairobi:</strong> same-day delivery if you order before 2 pm. Other counties 2 to 5 days.</span></li>
            <li className="flex items-start gap-3 py-4"><Package size={22} className="mt-0.5 text-ink" /><span>Free returns within 7 days if it does not fit. Pay on delivery available in Nairobi.</span></li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="display text-4xl">Complete the look</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
