/**
 * Turns an assistant reply into safe structure for React to draw. Only **bold**, "- " lists and [links](url) exist.
 * Nothing here ever produces HTML, so a reply cannot inject markup or script.
 */

export type Inline = { kind: "text"; text: string } | { kind: "bold"; text: string } | { kind: "link"; text: string; href: string };
export type Block = { kind: "paragraph"; inline: Inline[] } | { kind: "list"; items: Inline[][] };

/** http(s) and site paths only: no javascript:, data: or protocol-relative URLs. */
export function safeHref(v: string): string | null {
  const s = v.trim();
  if (/^https?:\/\/[^\s]+$/i.test(s)) return s;
  return /^\/(?!\/)[\w\-./?=&%#]*$/.test(s) ? s : null;
}

const TOKEN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: "bold", text: m[1] });
    else {
      const href = safeHref(m[3]);
      // An unsafe link keeps its words but loses the link.
      out.push(href ? { kind: "link", text: m[2], href } : { kind: "text", text: m[2] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

export function parseMessage(text: string): Block[] {
  const blocks: Block[] = [];
  let list: Inline[][] | null = null;
  for (const line of text.split("\n")) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ kind: "list", items: list });
      }
      list.push(parseInline(bullet[1]));
      continue;
    }
    list = null;
    if (line.trim()) blocks.push({ kind: "paragraph", inline: parseInline(line.trim()) });
  }
  return blocks;
}
