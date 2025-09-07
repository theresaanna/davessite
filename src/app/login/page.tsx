"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Login failed (${res.status})`);
      }
      router.push("/admin");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ display: "block", width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: 4, marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: "block", width: "100%", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: 4, marginTop: 4 }}
            />
          </label>
        </div>
        <button type="submit" disabled={loading || !username || !password} style={{ background: "var(--color-accent)", color: "#fff", border: 0, borderRadius: 4, padding: "0.5rem 0.75rem" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        {error && <div style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div>}
      </form>
    </section>
  );
}

