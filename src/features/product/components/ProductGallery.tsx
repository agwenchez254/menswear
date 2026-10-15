import type { ProductGalleryProps } from "@/features/product/models";
import { Photo } from "@/components/ui/Photo";

/** One large image followed by the remaining views for the selected colour. A product with no photos shows a placeholder. */
export function ProductGallery({ product, color, images, soldOut = false }: ProductGalleryProps) {
  const blur = soldOut ? "blur-[3px] grayscale opacity-60" : "";
  return (
    <div className="fade-in grid gap-2 sm:grid-cols-2">
      <div className="tile relative aspect-[4/5] bg-surface-2 sm:col-span-2 sm:aspect-[5/4]">
        <Photo src={images[0]} alt={`${product.name}, ${color}`} w={1400} eager position="50% 25%" className={`h-full w-full transition duration-300 ${blur}`} />
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="bg-paper/90 px-5 py-2.5 text-base font-semibold uppercase tracking-wide text-ink">Sold out</span>
          </span>
        )}
        {product.isNew && <span className="absolute left-0 top-0 bg-accent px-3 py-1 text-sm font-semibold text-accent-ink">New</span>}
      </div>
      {images.slice(1).map((src, i) => (
        <div key={`${i}-${src}`} className={`tile aspect-square bg-surface-2 ${images.length === 2 ? "sm:col-span-2 sm:aspect-[5/3]" : ""}`}>
          <Photo src={src} alt={`${product.name}, view ${i + 2}`} w={900} className={`h-full w-full transition duration-300 ${blur}`} />
        </div>
      ))}
    </div>
  );
}
