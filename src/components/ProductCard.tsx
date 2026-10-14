import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { formatKES, type Product } from "../data/products";
import { useCart } from "../store/cart";
import { Photo } from "./Photo";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const discount = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const second = product.images[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: Math.min(index, 7) * 0.05 }}
      className="group relative"
    >
      <Link to={`/product/${product.id}`} aria-label={`${product.name}, ${formatKES(product.price)}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
          <Photo id={product.images[0]} alt={product.name} w={640} className="absolute inset-0 transition duration-700 ease-out group-hover:scale-105" />
          {second && (
            <Photo id={second} alt="" w={640} className="absolute inset-0 opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100 max-md:hidden" />
          )}
          <div className="absolute left-0 top-0 flex flex-col items-start">
            {product.bestseller && <span className="bg-ink px-2.5 py-1 text-xs font-semibold text-on-ink">Bestseller</span>}
            {product.isNew && <span className="bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">New</span>}
            {discount > 0 && <span className="bg-surface px-2.5 py-1 text-xs font-semibold text-danger">-{discount}%</span>}
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium leading-snug">{product.name}</h3>
            <p className="mt-1 flex items-center gap-1.5">
              {product.colors.map((c) => (
                <span key={c.name} title={c.name} className="size-3 rounded-full border border-ink/20" style={{ background: c.hex }} />
              ))}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold tabular-nums">{formatKES(product.price)}</p>
            {product.compareAt && <p className="text-xs text-muted line-through tabular-nums">{formatKES(product.compareAt)}</p>}
          </div>
        </div>
      </Link>

      {/* Quick add: pointer devices only, so touch users go through the product page. */}
      <div className="absolute inset-x-0 top-0 hidden aspect-[4/5] items-end md:flex" aria-hidden={false}>
        <div className="pointer-events-none flex w-full translate-y-full flex-wrap gap-px bg-ink/90 p-2 opacity-0 backdrop-blur transition duration-300 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <span className="mb-1 w-full text-xs font-medium text-on-ink/70">Quick add</span>
          {product.sizes.slice(0, 8).map((s) => (
            <button
              key={s}
              onClick={() => add({ productId: product.id, size: s, color: product.colors[0].name })}
              className="min-h-9 min-w-9 flex-1 bg-on-ink/10 px-2 text-xs font-semibold text-on-ink transition hover:bg-accent hover:text-accent-ink"
              aria-label={`Add ${product.name} in size ${s} to bag`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/5]" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-3 w-1/3" />
    </div>
  );
}
