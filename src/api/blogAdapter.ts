/** Blog bodies arrive as the editor's rich-text JSON. Only these node and mark types are drawn; everything else is dropped. */

export type Mark = { type: "bold" | "italic" | "underline" | "strike" | "code" } | { type: "link"; href: string };

export type DocNode =
  | { type: "text"; text: string; marks: Mark[] }
  | { type: "paragraph" | "blockquote" | "listItem" | "bulletList" | "codeBlock"; align?: Align; content: DocNode[] }
  | { type: "heading"; level: 1 | 2 | 3 | 4; align?: Align; content: DocNode[] }
  | { type: "orderedList"; start: number; content: DocNode[] }
  | { type: "image"; src: string; alt: string }
  | { type: "horizontalRule" | "hardBreak" };

export type Align = "left" | "center" | "right";

export interface PostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  /** What lists show: the cover image, else the first image in the post. */
  thumbnailUrl: string | null;
  publishedAt: string | null;
}

export interface Post extends PostCard {
  content: DocNode[];
}

const ALIGN: readonly string[] = ["left", "center", "right"];
const CONTAINERS = new Set(["paragraph", "blockquote", "listItem", "bulletList", "codeBlock"]);
const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

/** http(s) and site paths only: no javascript:, data: or protocol-relative URLs. */
export function safeHref(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
}

function toMarks(raw: unknown): Mark[] {
  const out: Mark[] = [];
  for (const m of Array.isArray(raw) ? raw : []) {
    if (!isObj(m) || typeof m.type !== "string") continue;
    if (m.type === "link") {
      const href = isObj(m.attrs) ? safeHref(m.attrs.href) : null;
      if (href) out.push({ type: "link", href });
    } else if (SIMPLE_MARKS.has(m.type)) out.push({ type: m.type as "bold" });
  }
  return out;
}

function toNode(raw: unknown, depth: number): DocNode | null {
  if (!isObj(raw) || typeof raw.type !== "string" || depth > 12) return null;
  const attrs = isObj(raw.attrs) ? raw.attrs : {};
  const align = ALIGN.includes(attrs.textAlign as string) ? (attrs.textAlign as Align) : undefined;
  if (raw.type === "text") return typeof raw.text === "string" && raw.text ? { type: "text", text: raw.text, marks: toMarks(raw.marks) } : null;
  if (raw.type === "horizontalRule" || raw.type === "hardBreak") return { type: raw.type };
  if (raw.type === "image") {
    const src = safeHref(attrs.src);
    return src ? { type: "image", src, alt: typeof attrs.alt === "string" ? attrs.alt : "" } : null;
  }
  const content = (Array.isArray(raw.content) ? raw.content : []).map((c) => toNode(c, depth + 1)).filter((c): c is DocNode => c !== null);
  if (raw.type === "heading") {
    const level = typeof attrs.level === "number" && attrs.level >= 1 && attrs.level <= 4 ? (Math.trunc(attrs.level) as 1 | 2 | 3 | 4) : 2;
    return { type: "heading", level, align, content };
  }
  if (raw.type === "orderedList") return { type: "orderedList", start: typeof attrs.start === "number" && attrs.start >= 1 ? Math.trunc(attrs.start) : 1, content };
  if (CONTAINERS.has(raw.type)) return { type: raw.type as "paragraph", align, content };
  return null;
}

export function toDoc(raw: unknown): DocNode[] {
  if (!isObj(raw) || raw.type !== "doc" || !Array.isArray(raw.content)) return [];
  return raw.content.map((c) => toNode(c, 1)).filter((c): c is DocNode => c !== null);
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export function toPostCard(r: Raw): PostCard {
  return {
    id: str(r.id),
    slug: str(r.slug),
    title: str(r.title),
    excerpt: str(r.excerpt),
    coverUrl: typeof r.coverUrl === "string" && safeHref(r.coverUrl) ? r.coverUrl : null,
    thumbnailUrl: typeof r.thumbnailUrl === "string" && safeHref(r.thumbnailUrl) ? r.thumbnailUrl : null,
    publishedAt: typeof r.publishedAt === "string" ? r.publishedAt : null,
  };
}

export const toPost = (r: Raw): Post => ({ ...toPostCard(r), content: toDoc(r.content) });
