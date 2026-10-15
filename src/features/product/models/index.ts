import type { Gender, ProductDetail } from "@/models";

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
  /** Blurs the photos and labels the product as sold out. */
  soldOut?: boolean;
  product: ProductDetail;
  /** Selected colour name, used in alt text. */
  color: string;
  /** Photo URLs to show for the selected colour. The first is the large hero image. */
  images: string[];
}
