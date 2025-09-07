import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";

export async function generateStaticParams() {
  // Optional: could list slugs; skipping for simplicity (dynamic rendering)
  return [];
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();
  return (
    <article>
      <h2>{post.meta.title}</h2>
      {post.meta.date ? (
        <div style={{ color: "var(--color-muted)", marginBottom: 12 }}>{post.meta.date}</div>
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
      <div style={{ marginTop: 24 }}>
        <Link href="/blog">← Back to blog</Link>
      </div>
    </article>
  );
}

