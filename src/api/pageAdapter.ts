export type PageBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; url: string; alt: string }
  | { type: "button"; label: string; href: string };

export interface CmsPage {
  slug: string;
  title: string;
  blocks: PageBlock[];
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Pages are free-form JSON edited in the dashboard: keep the block types we can draw and drop the rest. */
export function toPage(r: { slug: string; title: string; blocks: unknown }): CmsPage {
  const blocks: PageBlock[] = [];
  for (const raw of Array.isArray(r.blocks) ? r.blocks : []) {
    if (typeof raw !== "object" || raw === null) continue;
    const b = raw as Record<string, unknown>;
    if (b.type === "heading" && str(b.text)) blocks.push({ type: "heading", text: str(b.text) });
    else if (b.type === "paragraph" && str(b.text)) blocks.push({ type: "paragraph", text: str(b.text) });
    else if (b.type === "list" && Array.isArray(b.items)) {
      const items = b.items.filter((i): i is string => typeof i === "string" && i.length > 0);
      if (items.length) blocks.push({ type: "list", items });
    } else if (b.type === "image" && /^https?:\/\//i.test(str(b.url))) blocks.push({ type: "image", url: str(b.url), alt: str(b.alt) });
    else if (b.type === "button" && str(b.label) && /^(https?:\/\/|\/)/i.test(str(b.href))) blocks.push({ type: "button", label: str(b.label), href: str(b.href) });
  }
  return { slug: r.slug, title: r.title, blocks };
}
