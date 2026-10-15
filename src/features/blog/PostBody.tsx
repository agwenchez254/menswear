import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Align, DocNode, Mark } from "@/api/blogAdapter";
import { Photo } from "@/components/ui/Photo";

const ALIGN_CLASS: Record<Align, string> = { left: "text-left", center: "text-center", right: "text-right" };
const alignOf = (a?: Align) => (a ? ALIGN_CLASS[a] : "");

function withMarks(text: string, marks: Mark[]): ReactNode {
  return marks.reduce<ReactNode>((inner, m) => {
    switch (m.type) {
      case "bold":
        return <strong>{inner}</strong>;
      case "italic":
        return <em>{inner}</em>;
      case "underline":
        return <u>{inner}</u>;
      case "strike":
        return <s>{inner}</s>;
      case "code":
        return <code className="rounded bg-surface-2 px-1 py-0.5 text-[0.9em]">{inner}</code>;
      case "link":
        return m.href.startsWith("/") ? (
          <Link to={m.href} className="underline underline-offset-4">
            {inner}
          </Link>
        ) : (
          <a href={m.href} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer nofollow">
            {inner}
          </a>
        );
    }
  }, text);
}

function nodes(list: DocNode[]): ReactNode {
  return list.map((n, i) => <Fragment key={i}>{node(n)}</Fragment>);
}

function node(n: DocNode): ReactNode {
  switch (n.type) {
    case "text":
      return withMarks(n.text, n.marks);
    case "hardBreak":
      return <br />;
    case "horizontalRule":
      return <hr className="my-8 border-line" />;
    case "image":
      return (
        <figure className="my-8">
          <Photo src={n.src} alt={n.alt} w={1400} className="w-full rounded-2xl" />
          {n.alt && <figcaption className="mt-2 text-center text-sm text-muted">{n.alt}</figcaption>}
        </figure>
      );
    case "paragraph":
      return <p className={`my-4 leading-relaxed ${alignOf(n.align)}`}>{nodes(n.content)}</p>;
    case "heading": {
      const cls = `display mb-3 mt-10 ${alignOf(n.align)}`;
      if (n.level === 1) return <h2 className={`${cls} text-4xl`}>{nodes(n.content)}</h2>;
      if (n.level === 2) return <h2 className={`${cls} text-3xl`}>{nodes(n.content)}</h2>;
      if (n.level === 3) return <h3 className={`${cls} text-2xl`}>{nodes(n.content)}</h3>;
      return <h4 className={`${cls} text-xl`}>{nodes(n.content)}</h4>;
    }
    case "bulletList":
      return <ul className="my-4 list-disc space-y-1 pl-6">{nodes(n.content)}</ul>;
    case "orderedList":
      return (
        <ol className="my-4 list-decimal space-y-1 pl-6" start={n.start}>
          {nodes(n.content)}
        </ol>
      );
    case "listItem":
      return <li>{nodes(n.content)}</li>;
    case "blockquote":
      return <blockquote className="my-6 border-l-4 border-ink/20 pl-4 italic text-muted">{nodes(n.content)}</blockquote>;
    case "codeBlock":
      return <pre className="my-6 overflow-x-auto rounded-xl bg-surface-2 p-4 text-sm">{nodes(n.content)}</pre>;
  }
}

/** Draws a blog post body. Built from React elements, never from HTML strings. */
export function PostBody({ doc }: { doc: DocNode[] }) {
  return <div className="text-[1.05rem]">{nodes(doc)}</div>;
}
