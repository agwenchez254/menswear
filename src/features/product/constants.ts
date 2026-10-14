import type { Gender } from "@/models";
import type { SizeChart } from "@/features/product/models";

/** Garment measurements in cm. Shoes and accessories use their own labelling. */
export const SIZE_CHARTS: Record<Gender, SizeChart> = {
  men: {
    upperLabel: "Chest (cm)",
    rows: [
      { size: "S", upper: "92 to 97", waist: "76 to 81" },
      { size: "M", upper: "97 to 102", waist: "81 to 86" },
      { size: "L", upper: "102 to 107", waist: "86 to 91" },
      { size: "XL", upper: "107 to 112", waist: "91 to 97" },
      { size: "XXL", upper: "112 to 118", waist: "97 to 104" },
    ],
  },
  women: {
    upperLabel: "Bust (cm)",
    rows: [
      { size: "XS", upper: "80 to 84", waist: "62 to 66" },
      { size: "S", upper: "84 to 88", waist: "66 to 70" },
      { size: "M", upper: "88 to 92", waist: "70 to 74" },
      { size: "L", upper: "92 to 98", waist: "74 to 80" },
      { size: "XL", upper: "98 to 104", waist: "80 to 86" },
    ],
  },
};

/** Stock at or below this shows a low-stock warning. */
export const LOW_STOCK_AT = 6;
