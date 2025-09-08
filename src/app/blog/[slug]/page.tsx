import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { formatDate } from "@/lib/date";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();
  
  // Check if post is a draft and if user is admin
  if (post.meta.status !== "published") {
    const session = await getSession();
    if (!session.user) {
      return notFound();
    }
  }
  return (
    <article>
      {post.meta.status === "draft" && (
        <div style={{ 
          padding: "0.5rem 1rem", 
          background: "#fef3c7", 
          border: "1px solid #fbbf24",
          borderRadius: 4,
          marginBottom: "1rem"
        }}>
          <strong>⚠️ Draft Post:</strong> This post is not published yet and only visible to admins.
        </div>
      )}
      <h2>{post.meta.title}</h2>
      {post.meta.date ? (
        <div style={{ color: "var(--color-muted)", marginBottom: 12 }}>{formatDate(post.meta.date)}</div>
      ) : null}
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.html }} />
      <div style={{ marginTop: 24 }}>
        <Link href="/blog">← Back to blog</Link>
      </div>
    </article>
  );
}

