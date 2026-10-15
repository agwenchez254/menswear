import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetPostsQuery } from "@/api/blog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Photo } from "@/components/ui/Photo";
import { blogPostPath } from "@/config/routes";
import { formatDate } from "@/lib/format";

/** One page of posts. Later pages are separate components so each keeps its own cache entry. */
function PostsPage({ cursor, onMore }: { cursor?: string; onMore: (c: string) => void }) {
  const { data, isLoading, error, refetch } = useGetPostsQuery(cursor);

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton aspect-[4/5]" />
        ))}
      </div>
    );
  }
  if (error || !data) return <ErrorState title="We could not load the journal" onRetry={() => void refetch()} />;
  if (data.items.length === 0 && !cursor) return <p className="py-16 text-center text-muted">No posts yet. Check back soon.</p>;

  return (
    <>
      <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((p) => (
          <article key={p.id}>
            <Link to={blogPostPath(p.slug)} className="group block">
              {p.thumbnailUrl ? (
                <Photo src={p.thumbnailUrl} alt="" w={900} className="aspect-[4/3] w-full rounded-2xl" />
              ) : (
                <span aria-hidden="true" className="display grid aspect-[4/3] w-full place-items-center rounded-2xl bg-surface-2 text-5xl text-muted">
                  {p.title.slice(0, 1)}
                </span>
              )}
              <p className="mt-4 text-sm text-muted">{p.publishedAt ? formatDate(p.publishedAt) : ""}</p>
              <h2 className="display mt-1 text-2xl group-hover:underline">{p.title}</h2>
              {p.excerpt && <p className="mt-2 line-clamp-3 text-muted">{p.excerpt}</p>}
            </Link>
          </article>
        ))}
      </div>
      {data.nextCursor && (
        <div className="mt-10 text-center">
          <button className="btn-ghost" onClick={() => onMore(data.nextCursor as string)}>
            Load more
          </button>
        </div>
      )}
    </>
  );
}

export default function BlogListPage() {
  const [cursors, setCursors] = useState<string[]>([]);
  const pages = [undefined, ...cursors];

  return (
    <section aria-labelledby="blog-title" className="mx-auto max-w-[1200px] px-4 pb-10 pt-14 md:px-8 md:pt-20">
      <h1 id="blog-title" className="display text-5xl md:text-6xl">
        The journal
      </h1>
      <p className="mt-3 max-w-[50ch] text-muted">Style notes, new arrivals and stories from the studio.</p>
      <div className="mt-10 space-y-10">
        {pages.map((c, i) => (
          <PostsPage key={c ?? "first"} cursor={c} onMore={(next) => i === pages.length - 1 && setCursors((cs) => [...cs, next])} />
        ))}
      </div>
    </section>
  );
}
