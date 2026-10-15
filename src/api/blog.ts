import { baseApi } from "./baseApi";
import { toPost, toPostCard, type Post, type PostCard } from "./blogAdapter";

interface PostPage {
  items: PostCard[];
  nextCursor: string | null;
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Published posts, newest first. Pass the previous `nextCursor` to get the next page. */
    getPosts: b.query<PostPage, string | void>({
      query: (cursor) => ({ url: "/blog", params: { limit: 9, ...(cursor ? { cursor } : {}) } }),
      transformResponse: (r: { items: Record<string, unknown>[]; nextCursor: string | null }): PostPage => ({ items: r.items.map(toPostCard), nextCursor: r.nextCursor }),
      providesTags: ["Blog"],
    }),
    getPost: b.query<Post, string>({
      query: (slug) => `/blog/${encodeURIComponent(slug)}`,
      transformResponse: (r: Record<string, unknown>) => toPost(r),
      providesTags: ["Blog"],
    }),
  }),
});

export const { useGetPostsQuery, useGetPostQuery } = blogApi;
