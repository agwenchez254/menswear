import { Link, useParams } from "react-router-dom";
import { useGetPageQuery } from "@/api/pages";
import { isNotFound } from "@/api/baseApi";
import { ErrorState } from "@/components/ui/ErrorState";
import { Photo } from "@/components/ui/Photo";

/** A help or info page written in the dashboard (delivery, sizing, paying with M-Pesa...). */
export default function HelpPage() {
  const { slug = "" } = useParams();
  const { data: page, isLoading, error, refetch } = useGetPageQuery(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24" aria-busy="true">
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton mt-6 h-40 w-full" />
      </div>
    );
  }

  if (!page) {
    if (error && !isNotFound(error)) return <ErrorState title="We could not load this page" onRetry={() => void refetch()} />;
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="display text-5xl">Page not found</h1>
        <p className="mt-3 text-muted">This page is not available right now.</p>
        <Link to="/" className="btn-dark mt-8">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-4 pb-10 pt-14 md:pt-20">
      <h1 className="display text-5xl md:text-6xl">{page.title}</h1>
      <div className="mt-8 space-y-5">
        {page.blocks.map((b, i) => {
          switch (b.type) {
            case "heading":
              return (
                <h2 key={i} className="display pt-4 text-3xl">
                  {b.text}
                </h2>
              );
            case "paragraph":
              return (
                <p key={i} className="leading-relaxed text-muted">
                  {b.text}
                </p>
              );
            case "list":
              return (
                <ul key={i} className="list-disc space-y-2 pl-5 text-muted">
                  {b.items.map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              );
            case "image":
              return <Photo key={i} src={b.url} alt={b.alt} w={1200} className="w-full" />;
            case "button":
              return b.href.startsWith("/") ? (
                <Link key={i} to={b.href} className="btn-dark">
                  {b.label}
                </Link>
              ) : (
                <a key={i} href={b.href} className="btn-dark" target="_blank" rel="noreferrer">
                  {b.label}
                </a>
              );
          }
        })}
      </div>
    </article>
  );
}
