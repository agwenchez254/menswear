import type { FooterLink, Gender, NavItem } from "@/models";

/** Primary navigation per side of the store. */
export const mainNav: Record<Gender, NavItem[]> = {
  men: [
    { to: "/shop", label: "Shop" },
    { to: "/shop?cat=suits", label: "Suits" },
    { to: "/shop?cat=shoes", label: "Shoes" },
    { to: "/shop?sort=new", label: "New in" },
    { to: "/gift", label: "Gifts" },
  ],
  women: [
    { to: "/shop", label: "Shop" },
    { to: "/shop?cat=dresses", label: "Dresses" },
    { to: "/shop?cat=shoes", label: "Shoes" },
    { to: "/shop?sort=new", label: "New in" },
    { to: "/gift", label: "Gifts" },
  ],
};

/** "Shop" column links in the footer. */
export const footerShopLinks: Record<Gender, FooterLink[]> = {
  men: [
    { slug: "suits", label: "Suits and blazers" },
    { slug: "shirts", label: "Shirts" },
    { slug: "shoes", label: "Shoes" },
    { slug: "kaunda", label: "Kaunda" },
  ],
  women: [
    { slug: "dresses", label: "Dresses" },
    { slug: "tops", label: "Tops" },
    { slug: "jackets", label: "Coats and jackets" },
    { slug: "shoes", label: "Shoes" },
  ],
};
