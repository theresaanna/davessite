"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ToolButton({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: active ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
        background: active ? "#eef2ff" : "#fff",
        color: "var(--color-text)",
        borderRadius: 4,
        padding: "0.25rem 0.5rem",
      }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span style={{ width: 1, background: "var(--color-border)", alignSelf: "stretch" }} />;
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
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      // Blockquote is included in StarterKit; avoid duplicate extension warning
    ],
    content: initialHTML,
    autofocus: true,
    immediatelyRender: false,
    onUpdate() {
      scheduleAutosave();
    },
  });

  const computedSlug = useMemo(() => (title ? slugify(title) : initialSlug || ""), [title, initialSlug]);
  const draftKey = useMemo(() => (initialSlug ? `editor-draft-${initialSlug}` : "editor-draft-new"), [initialSlug]);

  // Autosave draft on changes (debounced)
  const [autoTimer, setAutoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const onSaveDraft = useCallback(async () => {
    if (!title || !editor) return;
    setIsAutoSaving(true);
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
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(draftKey, JSON.stringify({ title, html: editor.getHTML() }));
        } catch {}
      }
      if (res.ok) setLastSavedAt(new Date().toISOString());
    } catch {}
    finally {
      setIsAutoSaving(false);
    }
  }, [title, computedSlug, editor, mode, initialSlug, draftKey]);

  const scheduleAutosave = useCallback(() => {
    if (!title || !editor) return;
    if (autoTimer) clearTimeout(autoTimer);
    const t = setTimeout(() => {
      onSaveDraft();
    }, 1500);
    setAutoTimer(t);
  }, [title, editor, autoTimer, onSaveDraft]);

  // Also autosave when the title changes
  useEffect(() => {
    scheduleAutosave();
    // intentionally not including scheduleAutosave in deps to avoid re-creating timer on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Load any locally saved draft on mount/editor ready
  useEffect(() => {
    if (!editor) return;
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const data = JSON.parse(raw || "{}");
        if (data.title) setTitle(data.title);
        if (data.html) editor.commands.setContent(data.html);
      }
    } catch {}
  }, [editor, draftKey]);

  const uploadImageFile = useCallback(async (file: File) => {
    setUploadingImage(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      if (data.url) {
        editor?.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploadingImage(false);
    }
  }, [editor]);

  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imgAlt, setImgAlt] = useState("");
  const [imgWidth, setImgWidth] = useState("100%");
  const [imgAlign, setImgAlign] = useState<"left"|"center"|"right">("center");
  const [imgCaption, setImgCaption] = useState("");

  useEffect(() => {
    if (!showImagePanel || !editor) return;
    const attrs = editor.getAttributes('image') || {};
    setImgAlt(attrs.alt || "");
    const currentStyle: string = attrs.style || "";
    const widthMatch = /width:\s*([^;]+)/.exec(currentStyle);
    setImgWidth(widthMatch ? widthMatch[1].trim() : "100%");
  }, [showImagePanel, editor]);


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
      if (typeof window !== "undefined") {
        try { localStorage.removeItem(draftKey); } catch {}
      }
      router.prefetch(`/blog/${data.slug}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Publish failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [title, computedSlug, editor, router, mode, initialSlug, draftKey]);

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

      {mode === "create" && (
        <div style={{ color: "var(--color-muted)", fontSize: 12, margin: "-0.25rem 0 0.25rem" }}>
          Note: autosave runs only after you add a title.
        </div>
      )}
      <div style={{ color: "var(--color-muted)", fontSize: 12, margin: "0 0 0.5rem" }}>
        Formatting tips: <a href="https://www.markdownguide.org/basic-syntax/" target="_blank" rel="noopener noreferrer">Markdown reference</a>
      </div>

      {/* Toolbar */}
      {editor && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          <ToolButton title="Bold (Cmd/Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolButton>
          <ToolButton title="Italic (Cmd/Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolButton>
          <ToolButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolButton>
          <Separator />
          <ToolButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolButton>
          <ToolButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolButton>
          <Separator />
          <ToolButton title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolButton>
          <ToolButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolButton>
          <Separator />
          <ToolButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;Quote&rdquo;</ToolButton>
          <Separator />
          <ToolButton title="Add/Remove link" active={editor.isActive('link')} onClick={() => {
            const href = window.prompt('Enter URL', editor.getAttributes('link').href || 'https://');
            if (href === null) return; // cancel
            if (href === '') { editor.chain().focus().unsetLink().run(); return; }
            editor.chain().focus().extendMarkRange('link').setLink({ href, target: '_blank' }).run();
          }}>Link</ToolButton>
          <ToolButton title="Insert image by URL" onClick={() => {
            const src = window.prompt('Image URL (https://...)');
            if (!src) return;
            editor.chain().focus().setImage({ src }).run();
          }}>Image URL</ToolButton>
          <ToolButton title="Upload image" onClick={() => fileInputRef.current?.click()}>{uploadingImage ? 'Uploading…' : 'Upload Image'}</ToolButton>
          <ToolButton title="Image settings (alt, caption, size, align)" onClick={() => setShowImagePanel((v) => !v)}>Image settings</ToolButton>
          <Separator />
          <ToolButton title="Undo (Cmd/Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>Undo</ToolButton>
          <ToolButton title="Redo (Cmd/Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()}>Redo</ToolButton>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={async (e) => {
          const inputEl = e.currentTarget;
          const files = inputEl.files ? Array.from(inputEl.files) : [];
          // Clear immediately to avoid React synthetic event nulling after await
          inputEl.value = '';
          for (const file of files) {
            if (file && file.type.startsWith('image/')) {
              await uploadImageFile(file);
            }
          }
        }}
      />

      {showImagePanel && (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 6, padding: 8, marginBottom: 8, background: "#fff" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <label>Alt
              <input value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} style={{ marginLeft: 4, padding: 4, border: "1px solid var(--color-border)", borderRadius: 4 }} />
            </label>
            <label>Width
              <input value={imgWidth} onChange={(e) => setImgWidth(e.target.value)} placeholder="e.g., 600px or 100%" style={{ marginLeft: 4, padding: 4, border: "1px solid var(--color-border)", borderRadius: 4 }} />
            </label>
            <label>Align
              <select value={imgAlign} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setImgAlign(e.target.value as "left" | "center" | "right")} style={{ marginLeft: 4, padding: 4, border: "1px solid var(--color-border)", borderRadius: 4 }}>
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
            </label>
            <label>Caption
              <input value={imgCaption} onChange={(e) => setImgCaption(e.target.value)} style={{ marginLeft: 4, padding: 4, border: "1px solid var(--color-border)", borderRadius: 4, minWidth: 240 }} />
            </label>
            <button type="button" onClick={() => {
              // Apply
              const styleParts: string[] = [];
              if (imgWidth) styleParts.push(`width:${imgWidth}`);
              if (imgAlign === 'center') { styleParts.push('display:block','margin-left:auto','margin-right:auto'); }
              else if (imgAlign === 'right') { styleParts.push('float:right','margin:0 0 1rem 1rem'); }
              else if (imgAlign === 'left') { styleParts.push('float:left','margin:0 1rem 1rem 0'); }
              const style = styleParts.join(';');
              const selTo = editor ? ((editor.state as import('@tiptap/pm/state').EditorState).selection?.to ?? null) : null;
              editor?.chain().focus().updateAttributes('image', { alt: imgAlt, style }).run();
              if (imgCaption.trim() && editor) {
                const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                const cap = esc(imgCaption.trim());
                if (typeof selTo === 'number') editor.chain().focus().setTextSelection(selTo).insertContent(`<p class=\"image-caption\">${cap}</p>`).run();
                else editor.chain().focus().insertContent(`<p class=\"image-caption\">${cap}</p>`).run();
              }
              setShowImagePanel(false);
              setImgCaption("");
            }} style={{ padding: "6px 10px", border: "1px solid var(--color-border)", borderRadius: 4 }}>Apply</button>
          </div>
        </div>
      )}

      <div
        className="editor-surface"
        onPaste={async (e) => {
          if (!e.clipboardData) return;
          const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
          if (files.length === 0) return;
          e.preventDefault();
          for (const f of files) {
            await uploadImageFile(f);
          }
        }}
        onDragOver={(e) => {
          if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault();
          }
        }}
        onDrop={async (e) => {
          if (!e.dataTransfer) return;
          const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
          if (files.length === 0) return;
          e.preventDefault();
          for (const f of files) {
            await uploadImageFile(f);
          }
        }}
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          padding: "0.75rem",
          background: "#fff",
        }}
      >
        {editor && <EditorContent editor={editor} />}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
        <span style={{ color: "var(--color-muted)", fontSize: 12 }}>
          {isAutoSaving ? "Autosaving…" : lastSavedAt ? `Draft saved at ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
        </span>
        {success && <span style={{ color: "#16a34a" }}>{success}</span>}
        {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
      </div>
    </section>
  );
}

