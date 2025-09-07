"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

function AutoSaveWatcher({ onChange, deps }: { onChange: () => void; deps: any[] }) {
  useEffect(() => {
    onChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function EditorClient({
  initialTitle = "",
  initialHTML = "<p>Write your post here…</p>",
  initialSlug = "",
  mode = "create",
}: {
  initialTitle?: string;
  initialHTML?: string;
  initialSlug?: string;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
    ],
    content: initialHTML,
    autofocus: true,
    immediatelyRender: false,
  });

  const html = useMemo(() => editor?.getHTML() ?? "", [editor, editor?.state]);
  const computedSlug = useMemo(() => (title ? slugify(title) : initialSlug || ""), [title, initialSlug]);

  // Autosave draft on changes (debounced)
  const [autoTimer, setAutoTimer] = useState<NodeJS.Timeout | null>(null);
  const contentSnapshot = useMemo(() => ({ title, html }), [title, html]);

  const scheduleAutosave = useCallback(() => {
    if (!title || !editor) return;
    if (autoTimer) clearTimeout(autoTimer as any);
    const t = setTimeout(() => {
      onSaveDraft();
    }, 1500);
    setAutoTimer(t as any);
  }, [title, editor, autoTimer, onSaveDraft]);

  const onSaveDraft = useCallback(async () => {
    if (!title || !editor) return;
    try {
      let res: Response;
      if ((mode === "edit" || initialSlug) && initialSlug) {
        res = await fetch(`/api/admin/posts/${initialSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug: computedSlug, html: editor.getHTML(), status: "draft" }),
        });
      } else {
        res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug: computedSlug, html: editor.getHTML(), status: "draft" }),
        });
      }
      if (!res.ok) return; // silent on autosave
    } catch {}
  }, [title, computedSlug, editor, mode, initialSlug]);

  const onPublish = useCallback(async () => {
    if (!title || !editor) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let res: Response;
      if ((mode === "edit" || initialSlug) && initialSlug) {
        res = await fetch(`/api/admin/posts/${initialSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug: computedSlug, html: editor.getHTML(), status: "published" }),
        });
      } else {
        res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug: computedSlug, html: editor.getHTML(), status: "published" }),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Publish failed (${res.status})`);
      }
      const data = await res.json();
      setSuccess(`Published as ${data.slug}.md`);
      router.prefetch(`/blog/${data.slug}`);
    } catch (e: any) {
      setError(e.message || "Publish failed");
    } finally {
      setSaving(false);
    }
  }, [title, computedSlug, editor, router, mode, initialSlug]);

  return (
    <section>
      <h2>{mode === "edit" ? "Edit Post" : "New Post"}</h2>
      <div style={{ margin: "1rem 0" }}>
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              marginTop: 4,
            }}
          />
        </label>
        <div style={{ color: "var(--color-muted)", marginTop: 4 }}>
          Slug: {computedSlug || "(auto)"}
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          padding: "0.75rem",
          background: "#fff",
        }}
      >
        {editor && <EditorContent editor={editor} />}
      </div>

      {/* Trigger autosave when content changes */}
      <AutoSaveWatcher onChange={scheduleAutosave} deps={[contentSnapshot]} />

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <button
          onClick={onPublish}
          disabled={saving || !title}
          style={{
            background: "var(--color-accent)",
            color: "#fff",
            border: 0,
            borderRadius: 4,
            padding: "0.5rem 0.75rem",
            cursor: saving || !title ? "not-allowed" : "pointer",
          }}
        >
          {saving ? (mode === "edit" ? "Updating…" : "Publishing…") : (mode === "edit" ? "Update & Publish" : "Publish")}
        </button>
        <button
          onClick={onSaveDraft}
          disabled={!title}
          style={{
            background: "transparent",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            padding: "0.5rem 0.75rem",
          }}
        >
          Save draft
        </button>
        {success && <span style={{ color: "#16a34a" }}>{success}</span>}
        {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
      </div>
    </section>
  );
}

