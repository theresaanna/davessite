"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import PreviewPane from "./PreviewPane";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ToolButton({ active, onClick, children, title, disabled = false }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        border: active ? "1px solid #8aa5d6" : "1px solid transparent",
        background: active ? "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)" : "#f3f4f6",
        color: active ? "#fff" : "#374151",
        borderRadius: 8,
        padding: "0.5rem 0.75rem",
        fontSize: "0.875rem",
        fontWeight: active ? 600 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
        boxShadow: active ? "0 2px 4px rgba(138, 165, 214, 0.3)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = "#e5e7eb";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = "#f3f4f6";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span style={{ 
    width: 1, 
    background: "linear-gradient(180deg, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent)", 
    alignSelf: "stretch",
    margin: "0 0.25rem"
  }} />;
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
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
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
        // Do not send status when updating to avoid downgrading a published post back to draft
        res = await fetch(`/api/admin/posts/${initialSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug: computedSlug, html: editor.getHTML() }),
        });
      } else {
        // For new posts, save as draft
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
      // trigger immediate revalidation for blog index and the post path
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: data.slug }),
        });
      } catch {}

      router.prefetch(`/blog/${data.slug}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Publish failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [title, computedSlug, editor, router, mode, initialSlug, draftKey]);

  return (
    <section style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)",
        padding: "2rem",
        borderRadius: "16px 16px 0 0",
        marginBottom: "2rem"
      }}>
        <h2 style={{ 
          color: "#fff", 
          fontSize: "1.875rem", 
          fontWeight: 700,
          margin: 0,
          textShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          {mode === "edit" ? "✏️ Edit Post" : "✨ Create New Post"}
        </h2>
      </div>
      
      <div style={{ 
        background: "#fff",
        borderRadius: 16,
        padding: "1.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
        marginBottom: "1.5rem"
      }}>
        <label style={{ display: "block", marginBottom: "1rem" }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "0.5rem"
          }}>
            <span style={{ 
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "#374151"
            }}>
              📝 Post Title
            </span>
            {mode === "create" && (
              <span style={{ 
                fontSize: "0.75rem", 
                color: "#6b7280",
                fontStyle: "italic"
              }}>
                💡 Autosave activates after adding a title
              </span>
            )}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter an engaging title for your post..."
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem 1rem",
              border: "2px solid #e5e7eb",
              borderRadius: 12,
              fontSize: "1rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
              outline: "none",
              background: "#f9fafb"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#8aa5d6";
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(138, 165, 214, 0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </label>
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: 8,
          fontSize: "0.875rem"
        }}>
          <span style={{ fontWeight: 600, color: "#6b7280" }}>🔗 URL Slug:</span>
          <code style={{ 
            background: "#fff",
            padding: "0.25rem 0.5rem",
            borderRadius: 4,
            color: "#8aa5d6",
            fontWeight: 500
          }}>
            {computedSlug || "auto-generated"}
          </code>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div style={{ 
        background: "#fff",
        borderRadius: 16,
        padding: "0.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        display: "flex",
        gap: "0.5rem"
      }}>
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          style={{
            flex: 1,
            padding: "0.75rem 1.5rem",
            background: activeTab === "write" 
              ? "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)" 
              : "transparent",
            border: "none",
            borderRadius: 12,
            color: activeTab === "write" ? "#fff" : "#6b7280",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
        >
          <span>{activeTab === "write" ? "✍️" : "📝"}</span>
          Write
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          style={{
            flex: 1,
            padding: "0.75rem 1.5rem",
            background: activeTab === "preview" 
              ? "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)" 
              : "transparent",
            border: "none",
            borderRadius: 12,
            color: activeTab === "preview" ? "#fff" : "#6b7280",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
        >
          <span>{activeTab === "preview" ? "👀" : "🔍"}</span>
          Preview
        </button>
      </div>

      {activeTab === "write" && (
        <div style={{ 
          padding: "0.75rem 1rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: 8,
          fontSize: "0.875rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span>💡</span>
          <span>Formatting tip: You can use </span>
          <a 
            href="https://www.markdownguide.org/basic-syntax/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: "#8aa5d6",
              fontWeight: 600,
              textDecoration: "underline"
            }}
          >
            Markdown syntax
          </a>
          <span>for rich text formatting</span>
        </div>
      )}

      {/* Toolbar - only show in Write mode */}
      {editor && activeTab === "write" && (
        <div style={{ 
          background: "#fff",
          borderRadius: 12,
          padding: "1rem",
          marginBottom: "1rem",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {/* Text Formatting */}
            <ToolButton title="Bold (Cmd/Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
              <strong>🅱</strong>
            </ToolButton>
            <ToolButton title="Italic (Cmd/Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <em style={{ fontStyle: "italic" }}>𝐼</em>
            </ToolButton>
            <ToolButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <span style={{ textDecoration: "underline" }}>𝑈</span>
            </ToolButton>
            
            <Separator />
            
            {/* Headers */}
            <ToolButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <span style={{ fontWeight: 700 }}>𝐇₂</span>
            </ToolButton>
            <ToolButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <span style={{ fontWeight: 600 }}>𝐇₃</span>
            </ToolButton>
            
            <Separator />
            
            {/* Lists */}
            <ToolButton title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              🔸 List
            </ToolButton>
            <ToolButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              🔢 List
            </ToolButton>
            
            <Separator />
            
            {/* Quote */}
            <ToolButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              💬 Quote
            </ToolButton>
            
            <Separator />
            
            {/* Links & Media */}
            <ToolButton title="Add/Remove link" active={editor.isActive('link')} onClick={() => {
              const href = window.prompt('Enter URL', editor.getAttributes('link').href || 'https://');
              if (href === null) return;
              if (href === '') { editor.chain().focus().unsetLink().run(); return; }
              editor.chain().focus().extendMarkRange('link').setLink({ href, target: '_blank' }).run();
            }}>
              🔗 Link
            </ToolButton>
            <ToolButton title="Insert image by URL" onClick={() => {
              const src = window.prompt('Image URL (https://...)');
              if (!src) return;
              editor.chain().focus().setImage({ src }).run();
            }}>
              🌐 Image
            </ToolButton>
            <ToolButton title="Upload image" disabled={uploadingImage} onClick={() => fileInputRef.current?.click()}>
              {uploadingImage ? '⏳ Uploading…' : '📁 Upload'}
            </ToolButton>
            <ToolButton title="Image settings" onClick={() => setShowImagePanel((v) => !v)}>
              ⚙️ Settings
            </ToolButton>
            
            <Separator />
            
            {/* History */}
            <ToolButton title="Undo (Cmd/Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
              ↩️ Undo
            </ToolButton>
            <ToolButton title="Redo (Cmd/Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()}>
              ↪️ Redo
            </ToolButton>
          </div>
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

      {showImagePanel && activeTab === "write" && (
        <div style={{ 
          background: "linear-gradient(135deg, #f4f7fc 0%, #e8eef7 100%)",
          border: "2px solid #8aa5d6",
          borderRadius: 12, 
          padding: "1rem", 
          marginBottom: "1rem",
          boxShadow: "0 4px 6px rgba(138, 165, 214, 0.15)"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem"
          }}>
            <h4 style={{ 
              margin: 0, 
              color: "#5a7aa8",
              fontWeight: 600,
              fontSize: "1rem"
            }}>
              🌆 Image Settings
            </h4>
            <button
              type="button"
              onClick={() => setShowImagePanel(false)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.25rem",
                cursor: "pointer",
                color: "#6b7280",
                padding: "0.25rem"
              }}
            >
              ×
            </button>
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            <label style={{ display: "block" }}>
              <span style={{ 
                display: "block", 
                marginBottom: "0.25rem", 
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#374151"
              }}>Alt Text</span>
              <input 
                value={imgAlt} 
                onChange={(e) => setImgAlt(e.target.value)} 
                placeholder="Describe the image"
                style={{ 
                  width: "100%",
                  padding: "0.5rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: 8,
                  fontSize: "0.875rem"
                }} 
              />
            </label>
            
            <label style={{ display: "block" }}>
              <span style={{ 
                display: "block", 
                marginBottom: "0.25rem", 
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#374151"
              }}>Width</span>
              <input 
                value={imgWidth} 
                onChange={(e) => setImgWidth(e.target.value)} 
                placeholder="e.g., 600px or 100%" 
                style={{ 
                  width: "100%",
                  padding: "0.5rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: 8,
                  fontSize: "0.875rem"
                }} 
              />
            </label>
            
            <label style={{ display: "block" }}>
              <span style={{ 
                display: "block", 
                marginBottom: "0.25rem", 
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#374151"
              }}>Alignment</span>
              <select 
                value={imgAlign} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setImgAlign(e.target.value as "left" | "center" | "right")} 
                style={{ 
                  width: "100%",
                  padding: "0.5rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: 8,
                  fontSize: "0.875rem",
                  background: "#fff"
                }}
              >
                <option value="left">← Left</option>
                <option value="center">↔ Center</option>
                <option value="right">→ Right</option>
              </select>
            </label>
            
            <label style={{ display: "block", gridColumn: "span 2" }}>
              <span style={{ 
                display: "block", 
                marginBottom: "0.25rem", 
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#374151"
              }}>Caption</span>
              <input 
                value={imgCaption} 
                onChange={(e) => setImgCaption(e.target.value)} 
                placeholder="Add a caption for this image"
                style={{ 
                  width: "100%",
                  padding: "0.5rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: 8,
                  fontSize: "0.875rem"
                }} 
              />
            </label>
            
            <button 
              type="button" 
              onClick={() => {
                const styleParts: string[] = [];
                if (imgWidth) styleParts.push(`width:${imgWidth}`);
                if (imgAlign === 'center') { 
                  styleParts.push('display:block','margin-left:auto','margin-right:auto'); 
                } else if (imgAlign === 'right') { 
                  styleParts.push('float:right','margin:0 0 1rem 1rem'); 
                } else if (imgAlign === 'left') { 
                  styleParts.push('float:left','margin:0 1rem 1rem 0'); 
                }
                const style = styleParts.join(';');
                const selTo = editor ? ((editor.state as import('@tiptap/pm/state').EditorState).selection?.to ?? null) : null;
                editor?.chain().focus().updateAttributes('image', { alt: imgAlt, style }).run();
                if (imgCaption.trim() && editor) {
                  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                  const cap = esc(imgCaption.trim());
                  if (typeof selTo === 'number') {
                    editor.chain().focus().setTextSelection(selTo).insertContent(`<p class=\"image-caption\">${cap}</p>`).run();
                  } else {
                    editor.chain().focus().insertContent(`<p class=\"image-caption\">${cap}</p>`).run();
                  }
                }
                setShowImagePanel(false);
                setImgCaption("");
              }} 
              style={{ 
                gridColumn: "span 1",
                padding: "0.5rem 1rem", 
                background: "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)",
                color: "#fff",
                border: "none", 
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(138, 165, 214, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              ✓ Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* Editor or Preview Content */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
        marginBottom: "1.5rem"
      }}>
        {activeTab === "write" ? (
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
                e.currentTarget.style.background = "#f4f7fc";
                e.currentTarget.style.borderColor = "#8aa5d6";
              }
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
            onDrop={async (e) => {
              if (!e.dataTransfer) return;
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              if (files.length === 0) return;
              e.preventDefault();
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
              for (const f of files) {
                await uploadImageFile(f);
              }
            }}
            style={{
              border: "2px dashed #e5e7eb",
              borderRadius: 12,
              padding: "1.5rem",
              background: "#fff",
              minHeight: "400px",
              margin: "1rem",
              transition: "all 0.3s ease",
              position: "relative"
            }}
          >
            {(!editor || !editor.getText()) && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "#9ca3af",
                pointerEvents: "none"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📝</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 500 }}>Start writing your post...</div>
                <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>You can drag & drop images here</div>
              </div>
            )}
            {editor && <EditorContent editor={editor} />}
          </div>
        ) : (
          <div
            style={{
              background: "linear-gradient(180deg, #f9fafb 0%, #fff 100%)",
              minHeight: "500px",
              position: "relative",
              overflow: "auto"
            }}
          >
            <PreviewPane 
              title={title} 
              html={editor?.getHTML() || ""} 
              slug={computedSlug}
              isPublished={false}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        borderRadius: 16,
        padding: "1.5rem",
        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)"
      }}>
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={onPublish}
            disabled={saving || !title}
            style={{
              background: saving || !title 
                ? "#e5e7eb" 
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: saving || !title ? "#9ca3af" : "#fff",
              border: "none",
              borderRadius: 12,
              padding: "0.875rem 1.75rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: saving || !title ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: saving || !title 
                ? "none" 
                : "0 4px 6px rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              if (!saving && title) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 8px rgba(16, 185, 129, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              if (!saving && title) {
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(16, 185, 129, 0.25)";
              }
            }}
          >
            <span>{saving ? "⏳" : "🚀"}</span>
            {saving ? (mode === "edit" ? "Updating…" : "Publishing…") : (mode === "edit" ? "Update & Publish" : "Publish Post")}
          </button>
          
          <button
            onClick={onSaveDraft}
            disabled={!title || isAutoSaving}
            style={{
              background: "#fff",
              color: "#374151",
              border: "2px solid #e5e7eb",
              borderRadius: 12,
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: !title || isAutoSaving ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: !title || isAutoSaving ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              if (title && !isAutoSaving) {
                e.currentTarget.style.borderColor = "#8aa5d6";
                e.currentTarget.style.background = "#f4f7fc";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.background = "#fff";
            }}
          >
            <span>{isAutoSaving ? "⏳" : "💾"}</span>
            {isAutoSaving ? "Saving…" : "Save as Draft"}
          </button>
          
          {/* Status Messages */}
          <div style={{ 
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            justifyContent: "flex-end",
            minWidth: "200px"
          }}>
            {lastSavedAt && !error && !success && (
              <span style={{ 
                color: "#6b7280", 
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}>
                <span style={{ color: "#10b981" }}>✓</span>
                Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </span>
            )}
            
            {success && (
              <span style={{ 
                color: "#fff",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "0.5rem 1rem",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                animation: "fadeIn 0.3s ease"
              }}>
                <span>🎉</span>
                {success}
              </span>
            )}
            
            {error && (
              <span style={{ 
                color: "#fff",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                padding: "0.5rem 1rem",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span>⚠️</span>
                {error}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

