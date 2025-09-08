"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthControls() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: { username: string } | null };
        if (!cancelled) setUser(data.user ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Link href="/login" style={{ color: "var(--color-text)" }}>
        Login
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Link href="/admin" style={{ color: "var(--color-muted)" }}>Hi, {user.username}</Link>
      <button
        onClick={logout}
        style={{
          background: "transparent",
          border: "1px solid var(--color-border)",
          padding: "0.25rem 0.5rem",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}

