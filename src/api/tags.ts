/** RTK Query tag types. The backend's SSE `invalidate` events use exactly these names. */
export const TAGS = ["Home", "Product", "Category", "Content", "Settings", "Delivery", "Testimonial", "Me", "Addresses", "Blog", "OrderStatus", "Orders"] as const;
export type StoreTag = (typeof TAGS)[number];
