/** The delivery section's decorative backdrop (static, not editable in the CMS). */
export const NAIROBI_SKYLINE = "1596005554384-d293674c91d7";

export const unsplash = (id: string, w: number): string => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

const isResizable = (url: string): boolean => {
  try {
    return new URL(url).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
};

/** Request width `w` from Unsplash. Other hosts (our own uploads, other CDNs) are returned unchanged. */
export function sized(url: string, w: number): string {
  if (!isResizable(url)) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(w));
  return u.toString();
}

/** A three-width `srcSet`, or undefined when the image cannot be resized. */
export function srcSetFor(url: string, w: number): string | undefined {
  if (!isResizable(url)) return undefined;
  const small = Math.round(w * 0.6);
  return `${sized(url, small)} ${small}w, ${sized(url, w)} ${w}w, ${sized(url, w * 2)} ${w * 2}w`;
}
