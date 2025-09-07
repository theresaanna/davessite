"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PostRow = {
  title: string;
  slug: string;
  date?: string;
};

export default function AdminPostsTable({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onDelete(slug: string) {
    const ok = confirm(`Delete post "${slug}"? This cannot be undone.`);
    if (!ok) return;
    const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((ps) => ps.filter((p) => p.slug !== slug));
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || `Delete failed (${res.status})`);
    }
  }

  return (
    <section>
      <h2>Posts</h2>
      {posts.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No posts yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Slug</th>
                <th style={th}>Date</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.slug}>
                  <td style={td}><Link href={`/blog/${p.slug}`}>{p.title}</Link></td>
                  <td style={td}><code>{p.slug}</code></td>
                  <td style={td}><span style={{ color: "var(--color-muted)" }}>{p.date || ""}</span></td>
                  <td style={td}>
                    <button
                      onClick={() => onDelete(p.slug)}
                      style={{ border: "1px solid #ef4444", color: "#ef4444", background: "transparent", padding: "0.25rem 0.5rem", borderRadius: 4 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid var(--color-border)",
};

const td: React.CSSProperties = {
  padding: "0.5rem",
  borderBottom: "1px solid var(--color-border)",
};

