/** Which side of the store a product or category belongs to. Also drives the visual theme. */
export type Gender = "men" | "women";

export type CategorySlug =
  | "shirts"
  | "trousers"
  | "suits"
  | "shoes"
  | "tshirts"
  | "jackets"
  | "accessories"
  | "kaunda"
  | "dresses"
  | "tops"
  | "knitwear";

export interface Swatch {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  gender: Gender;
  category: CategorySlug;
  /** Price in Kenya Shillings. */
  price: number;
  /** Original price when the item is discounted. */
  compareAt?: number;
  colors: Swatch[];
  sizes: string[];
  /** Photo IDs. The first is the main image. */
  images: string[];
  /** Optional photos per colour name. Colours not listed fall back to `images`. */
  colorImages?: Record<string, string[]>;
  bestseller?: boolean;
  isNew?: boolean;
  rating: number;
  sold: number;
  stock: number;
  blurb: string;
}

/** Authoring shape used in the catalogue. Derived fields get defaults when the catalogue is built. */
export type ProductSeed = Omit<Product, "id" | "gender" | "rating" | "sold" | "stock"> & {
  gender?: Gender;
  rating?: number;
  sold?: number;
  stock?: number;
};

export interface CategoryDef {
  slug: CategorySlug;
  label: string;
  tag: string;
  /** Photo ID used on category tiles. */
  image: string;
}
