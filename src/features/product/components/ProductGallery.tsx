import type { ProductGalleryProps } from "@/features/product/models";
import { Photo } from "@/components/ui/Photo";

/** One large image followed by the remaining views for the selected colour. */
export function ProductGallery({ product, color, images }: ProductGalleryProps) {
  return (
    <div className="fade-in grid gap-2 sm:grid-cols-2">
      <div className="tile relative aspect-[4/5] bg-surface-2 sm:col-span-2 sm:aspect-[5/4]">
        <Photo key={images[0]} id={images[0]} alt={`${product.name}, ${color}`} w={1400} eager position="50% 25%" className="h-full w-full" />
        {product.isNew && <span className="absolute left-0 top-0 bg-accent px-3 py-1 text-sm font-semibold text-accent-ink">New</span>}
      </div>
      {images.slice(1).map((id, i) => (
        <div key={id} className={`tile aspect-square bg-surface-2 ${images.length === 2 ? "sm:col-span-2 sm:aspect-[5/3]" : ""}`}>
          <Photo id={id} alt={`${product.name}, view ${i + 2}`} w={900} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
