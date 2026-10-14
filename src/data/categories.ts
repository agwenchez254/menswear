import type { CategoryDef, Gender } from "@/models";
import { photo } from "@/data/photos";

export const categoriesByGender: Record<Gender, CategoryDef[]> = {
  men: [
    { slug: "suits", label: "Suits & Blazers", tag: "Weddings, boardrooms, Sundays", image: photo.suitGreen },
    { slug: "shirts", label: "Shirts", tag: "Oxford, linen, poplin", image: photo.shirtWhiteTie },
    { slug: "shoes", label: "Shoes", tag: "Leather and sneakers", image: photo.shoeLeatherClose },
    { slug: "kaunda", label: "Kaunda", tag: "The classic, reworked", image: photo.jacketDarkWatch },
    { slug: "trousers", label: "Trousers", tag: "Chinos, wool, denim", image: photo.chinosMan },
    { slug: "jackets", label: "Jackets", tag: "Bombers and leather", image: photo.bomberRust },
    { slug: "tshirts", label: "T-Shirts & Polos", tag: "Heavy cotton basics", image: photo.teeWhiteMan },
    { slug: "accessories", label: "Accessories", tag: "Watches, ties, wallets", image: photo.watchChrono },
  ],
  women: [
    { slug: "dresses", label: "Dresses", tag: "Day, evening and everything between", image: photo.wRedFloral },
    { slug: "tops", label: "Tops", tag: "Blouses, shirts and tees", image: photo.wBlouseRack },
    { slug: "knitwear", label: "Knitwear", tag: "Soft layers", image: photo.wChevronKnit },
    { slug: "jackets", label: "Coats & Jackets", tag: "Wool, denim, tailoring", image: photo.wBlueCoat },
    { slug: "trousers", label: "Trousers & Jeans", tag: "Wide-leg to skinny", image: photo.wStripedPants },
    { slug: "shoes", label: "Shoes", tag: "Heels and flats", image: photo.wFloralHeel },
    { slug: "accessories", label: "Bags & Jewellery", tag: "Finishing touches", image: photo.wRedBag },
  ],
};

/** Men's categories, kept under the old name for older imports. */
export const categories = categoriesByGender.men;
