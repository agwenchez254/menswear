import type { ProductVariant } from "../models/product.ts";

/** The variant a bag line refers to: its colour and size. A colour-less variant matches any colour. */
export function variantIdFor(variants: ProductVariant[], color: string, size: string): string | null {
  const own = variants.find((v) => v.size === size && v.colourName === color);
  return (own ?? variants.find((v) => v.size === size && v.colourName === null))?.id ?? null;
}
