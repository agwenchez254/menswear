export interface FaqItem {
  /** Stable, URL-safe: the page opens this question when the address ends in #id. */
  id: string;
  category: string;
  question: string;
  answer: string;
  /** Pages that go with the answer, shown as links under it. */
  links?: { label: string; to: string }[];
}

const norm = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();
const words = (query: string): string[] => norm(query).split(" ").filter(Boolean);

/** Questions that fit the category and contain every word of the search, in the question or the answer. */
export function filterFaqs(items: FaqItem[], category: string, query: string): FaqItem[] {
  const terms = words(query);
  return items.filter((i) => {
    if (category !== "all" && i.category !== category) return false;
    if (terms.length === 0) return true;
    const hay = norm(`${i.question} ${i.answer}`);
    return terms.every((t) => hay.includes(t));
  });
}

/** How many questions each category would show for this search, for the filter chips. Empty categories are left out. */
export function categoryCounts(items: FaqItem[], query: string): Record<string, number> {
  const out: Record<string, number> = { all: 0 };
  for (const i of filterFaqs(items, "all", query)) {
    out.all += 1;
    out[i.category] = (out[i.category] ?? 0) + 1;
  }
  return out;
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Splits text into plain and matching pieces so the search words can be marked. The pieces always join back to the text. */
export function highlightParts(text: string, query: string): { text: string; hit: boolean }[] {
  const terms = words(query);
  if (terms.length === 0) return [{ text, hit: false }];
  const re = new RegExp(terms.map(escapeRe).join("|"), "gi");
  const parts: { text: string; hit: boolean }[] = [];
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m[0] === "") {
      re.lastIndex += 1;
      continue;
    }
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts.length ? parts : [{ text, hit: false }];
}
