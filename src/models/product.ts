/** Which side of the store a product or category belongs to. Also drives the visual theme. */
export type Gender = "men" | "women";

export interface Swatch {
  name: string;
  hex: string;
}

/** A product as shown in lists and cards. Comes from the API (`/store/products`). */
export interface Product {
  id: string;
  /** URL key: `/product/:slug`. */
  slug: string;
  name: string;
  gender: Gender;
  /** Category slug. */
  category: string;
  categoryLabel: string;
  /** Price in Kenya Shillings. */
  price: number;
  /** Original price when the item is discounted. */
  compareAt?: number;
  colors: Swatch[];
  sizes: string[];
  /** Main photo URL; null until an editor adds one. */
  image: string | null;
  bestseller?: boolean;
  isNew?: boolean;
  rating: number;
  sold: number;
  inStock: boolean;
}

export interface ProductVariant {
  /** The id the cart and checkout endpoints take. */
  id: string;
  /** Colour name, or null when the variant is not tied to a colour. */
  colourName: string | null;
  size: string;
  available: number;
  inStock: boolean;
}

/** A product page: the card fields plus galleries and stock. */
export interface ProductDetail extends Product {
  blurb: string;
  /** Shared gallery (photo URLs). */
  images: string[];
  /** Gallery per colour name; a colour without its own photos shows the shared gallery. */
  colorImages: Record<string, string[]>;
  variants: ProductVariant[];
}

export interface CategoryDef {
  slug: string;
  label: string;
  tag: string;
  image: string | null;
  /** Number of active products. */
  count: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
}
