"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date";

export type PostRow = {
  title: string;
  slug: string;
  date?: string;
  status?: "draft" | "published";
};

export default function AdminPostsTable({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [, startTransition] = useTransition();
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
                <th style={th}>Status</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.slug}>
                  <td style={td}>
                    <Link href={`/blog/${p.slug}`} title={p.status === "draft" ? "View draft (admin only)" : "View published post"}>
                      {p.title}
                    </Link>
                  </td>
                  <td style={td}><code>{p.slug}</code></td>
                  <td style={td}><span style={{ color: "var(--color-muted)" }}>{formatDate(p.date)}</span></td>
                  <td style={td}>
                    <span style={{ 
                      padding: "0.125rem 0.375rem", 
                      border: p.status === "draft" ? "1px solid #f59e0b" : "1px solid #10b981",
                      background: p.status === "draft" ? "#fef3c7" : "#d1fae5",
                      color: p.status === "draft" ? "#92400e" : "#064e3b",
                      borderRadius: 9999, 
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {p.status === "draft" ? "📝 Draft" : "✅ Published"}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/admin/posts/${p.slug}/edit`} style={{ border: "1px solid var(--color-border)", padding: "0.25rem 0.5rem", borderRadius: 4 }}>Edit</Link>
                      <button
                        onClick={async () => {
                          const next = p.status === "published" ? "draft" : "published";
                          const res = await fetch(`/api/admin/posts/${p.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
                          if (res.ok) setPosts((ps) => ps.map((it) => it.slug === p.slug ? { ...it, status: next } : it));
                        }}
                        style={{ border: "1px solid var(--color-border)", background: "transparent", padding: "0.25rem 0.5rem", borderRadius: 4 }}
                      >
                        {p.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => onDelete(p.slug)}
                        style={{ border: "1px solid #ef4444", color: "#ef4444", background: "transparent", padding: "0.25rem 0.5rem", borderRadius: 4 }}
                      >
                        Delete
                      </button>
                    </div>
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

