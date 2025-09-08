import Link from "next/link";
import { getAllPostsMeta } from "@/lib/posts";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog — Dave's Site",
};

export default async function BlogPage() {
  const posts = await getAllPostsMeta();
  return (
    <section>
      <h2>Blog</h2>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul>
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>
                {p.title} {p.date ? <span style={{ color: "var(--color-muted)" }}>({formatDate(p.date)})</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

