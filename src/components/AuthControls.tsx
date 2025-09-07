"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthControls({ user }: { user: { username: string } | null }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.refresh();
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
      <span style={{ color: "var(--color-muted)" }}>Hi, {user.username}</span>
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

