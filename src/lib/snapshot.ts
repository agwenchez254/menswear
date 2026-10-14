import type { Product, ProductSnapshot } from "@/models";

/** What a bag line remembers about its product. `image` overrides the main photo (e.g. the chosen colour). */
export const snapshotOf = (p: Product, image?: string | null): ProductSnapshot => ({
  slug: p.slug,
  name: p.name,
  price: p.price,
  image: image ?? p.image,
});
