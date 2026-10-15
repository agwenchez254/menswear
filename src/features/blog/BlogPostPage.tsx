import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetPostQuery } from "@/api/blog";
import { isNotFound } from "@/api/baseApi";
import { ErrorState } from "@/components/ui/ErrorState";
import { Photo } from "@/components/ui/Photo";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/lib/format";
import { PostBody } from "@/features/blog/PostBody";

export default function BlogPostPage() {
  const { slug = "" } = useParams();
  const { data: post, isLoading, error, refetch } = useGetPostQuery(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24" aria-busy="true">
        <div className="skeleton h-12 w-3/4" />
        <div className="skeleton mt-8 h-64 w-full" />
      </div>
    );
  }

  if (!post) {
    if (error && !isNotFound(error)) return <ErrorState title="We could not load this post" onRetry={() => void refetch()} />;
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="display text-5xl">Post not found</h1>
        <p className="mt-3 text-muted">It may have been moved or taken down.</p>
        <Link to={ROUTES.blog} className="btn-dark mt-8">
          Back to the journal
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-4 pb-10 pt-10 md:pt-16">
      <Link to={ROUTES.blog} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> The journal
      </Link>
      <p className="mt-6 text-sm text-muted">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
      <h1 className="display mt-2 text-5xl md:text-6xl">{post.title}</h1>
      {post.coverUrl && <Photo src={post.coverUrl} alt="" w={1400} className="mt-8 aspect-[16/9] w-full rounded-2xl" eager />}
      <div className="mt-8">
        <PostBody doc={post.content} />
      </div>
    </article>
  );
}
