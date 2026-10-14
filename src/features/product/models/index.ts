import type { Gender, Product } from "@/models";

export interface SizeChartRow {
  size: string;
  /** Chest (men) or bust (women), in cm. */
  upper: string;
  /** Waist, in cm. */
  waist: string;
}

export interface SizeChart {
  /** Column heading for the upper-body measurement. */
  upperLabel: string;
  rows: SizeChartRow[];
}

export interface SizeGuideProps {
  gender: Gender;
}

export interface ProductGalleryProps {
  product: Product;
  /** Selected colour name, used in alt text. */
  color: string;
  /** Photo IDs to show for the selected colour. The first is the large hero image. */
  images: string[];
}
