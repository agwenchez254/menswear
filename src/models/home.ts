import type { CategoryDef, Product, Testimonial } from "./product";

/** Hero block data (`home.hero.<gender>`). */
export interface HeroBlock {
  /** Two headline lines. The second is highlighted. */
  lines: [string, string];
  sub: string;
  cta: string;
  /** Photo URL. */
  image: string;
  alt: string;
  /** CSS object-position for the photo. */
  focalPoint: string;
  /** Product slug shown in the "Pictured" tag. Empty hides the tag. */
  featuredProductSlug: string;
}

export interface TrustItem {
  /** Icon name: phone, package, ruler or hand-coins. Unknown names show a package. */
  icon: string;
  title: string;
  text: string;
}

export interface SectionsBlock {
  categoriesTitle: string;
  topProductsTitle: string;
}

/** The sample gift played in the home teaser. */
export interface GiftBlock {
  productSlug: string;
  colour: string;
  wrap: string;
  ribbon: string;
  message: string;
  from: string;
  to: string;
}

/** Everything the home page renders, already adapted from `/store/home`. */
export interface HomeData {
  hero: HeroBlock | null;
  trust: TrustItem[];
  sections: SectionsBlock | null;
  gift: GiftBlock | null;
  testimonials: Testimonial[];
  categories: CategoryDef[];
  topProducts: Product[];
}
