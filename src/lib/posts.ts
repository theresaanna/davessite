import path from "node:path";
import fs from "node:fs/promises";
import matter from "gray-matter";
import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element, Parent } from "hast";
import { list, put as blobPut, del as blobDel } from "@vercel/blob";

export type PostMeta = {
  title: string;
  slug: string;
  date?: string;
  status?: "draft" | "published";
};

const postsDir = path.join(process.cwd(), "content", "posts");

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const useBlob = !!blobToken;

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeDate(value: unknown): string | undefined {
  if (!value) return undefined;
  let d: Date | null = null;
  if (value instanceof Date) d = value;
  else if (typeof value === "string" || typeof value === "number") d = new Date(value);
  if (!d || isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export async function ensurePostsDir() {
  await fs.mkdir(postsDir, { recursive: true });
}

export async function getAllPostsMeta(opts?: { includeDrafts?: boolean }): Promise<PostMeta[]> {
  const includeDrafts = !!opts?.includeDrafts;
  const metas: PostMeta[] = [];
  if (useBlob) {
    const { blobs } = await list({ prefix: "posts/", token: blobToken });
    for (const b of blobs) {
      if (!b.pathname.endsWith(".md")) continue;
      const slug = b.pathname.replace(/^posts\//, "").replace(/\.md$/, "");
      const raw = await fetch(b.url).then((r) => r.text());
      const { data } = matter(raw);
      const status = (data as { status?: "draft" | "published" }).status ?? "published";
      if (!includeDrafts && status !== "published") continue;
      metas.push({
        title: (data.title as string) || slug,
        slug,
        date: normalizeDate((data as { date?: string | number | Date }).date),
        status,
      });
    }
  } else {
    await ensurePostsDir();
    const files = await fs.readdir(postsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    for (const file of mdFiles) {
      const full = path.join(postsDir, file);
      const raw = await fs.readFile(full, "utf8");
      const { data } = matter(raw);
      const slug = file.replace(/\.md$/, "");
      const status = (data as { status?: "draft" | "published" }).status ?? "published";
      if (!includeDrafts && status !== "published") continue;
      metas.push({
        title: (data.title as string) || slug,
        slug,
        date: normalizeDate((data as { date?: string | number | Date }).date),
        status,
      });
    }
  }
  metas.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return metas;
}

export async function getPostBySlug(slug: string): Promise<{ meta: PostMeta; html: string; markdown: string } | null> {
  try {
    const raw = await (async () => {
      if (useBlob) {
        const { blobs } = await list({ prefix: `posts/${slug}.md`, token: blobToken });
        const b = blobs.find((x) => x.pathname === `posts/${slug}.md`);
        if (!b) throw new Error("not found");
        return await fetch(b.url).then((r) => r.text());
      } else {
        const filePath = path.join(postsDir, `${slug}.md`);
        return await fs.readFile(filePath, "utf8");
      }
    })();
    const { data, content } = matter(raw);
    // Render Markdown to HTML while allowing embedded raw HTML (for images/captions)
    const processed = await remark()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(function rehypeWrapImages() {
        return (tree: Root) => {
          visit(tree, 'element', (node: Element, index: number | undefined, parent: Parent | undefined) => {
            if (!node || node.tagName !== 'img' || !parent || typeof index !== 'number') return;
            // If already wrapped in a link, skip
            const parentEl = parent as unknown as Element;
            if (parentEl.tagName === 'a') return;
            const props = (node.properties ?? {}) as { src?: string };
            const src = props.src;
            if (!src) return;
            const link: Element = {
              type: 'element',
              tagName: 'a',
              properties: { href: src, target: '_blank', rel: 'noopener noreferrer' },
              children: [node],
            };
            (parent.children as Element[])[index] = link;
          });
        };
      })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);
    const contentHtml = String(processed);
    const meta: PostMeta = {
      title: (data.title as string) || slug,
      slug,
      date: normalizeDate((data as { date?: string | number | Date }).date),
      status: (data as { status?: "draft" | "published" }).status ?? "published",
    };
    return { meta, html: contentHtml, markdown: content };
  } catch {
    return null;
  }
}

export async function saveMarkdownPost({
  title,
  slug,
  markdown,
  status = "draft",
}: {
  title: string;
  slug?: string;
  markdown: string;
  status?: "draft" | "published";
}): Promise<{ slug: string; path: string }> {
  const finalSlug = slug && slug.length > 0 ? slugify(slug) : slugify(title);
  const now = new Date().toISOString();
  const file = matter.stringify(markdown, { title, date: now, slug: finalSlug, status });
  if (useBlob) {
    const key = `posts/${finalSlug}.md`;
await blobPut(key, file, { access: "public", contentType: "text/markdown", token: blobToken, allowOverwrite: true });
    return { slug: finalSlug, path: key };
  } else {
    await ensurePostsDir();
    const filePath = path.join(postsDir, `${finalSlug}.md`);
    await fs.writeFile(filePath, file, "utf8");
    return { slug: finalSlug, path: filePath };
  }
}

export async function updateMarkdownPost({
  prevSlug,
  title,
  slug,
  markdown,
  status,
}: {
  prevSlug: string;
  title: string;
  slug?: string;
  markdown: string;
  status?: "draft" | "published";
}): Promise<{ slug: string; path: string }> {
  const newSlug = slug && slug.length > 0 ? slugify(slug) : slugify(title);
  let data: Record<string, unknown> = { title, slug: newSlug };
  let content = markdown;
  try {
    const existing = await getPostBySlug(prevSlug);
    if (existing) {
      const parsed = matter(existing.markdown);
      data = { ...(parsed.data as Record<string, unknown>), title, slug: newSlug };
      content = markdown ?? (parsed.content as string);
    }
  } catch {}
  if (status) {
    (data as { status?: string }).status = status;
    if (status === "published" && !(data as { date?: string }).date) {
      (data as { date?: string }).date = new Date().toISOString();
    }
  }
  const file = matter.stringify(content, data as Record<string, unknown>);
  if (useBlob) {
    const newKey = `posts/${newSlug}.md`;
await blobPut(newKey, file, { access: "public", contentType: "text/markdown", token: blobToken, allowOverwrite: true });
    if (prevSlug !== newSlug) {
      try { await blobDel(`posts/${prevSlug}.md`, { token: blobToken }); } catch {}
    }
    return { slug: newSlug, path: newKey };
  } else {
    await ensurePostsDir();
    const prevPath = path.join(postsDir, `${prevSlug}.md`);
    const newPath = path.join(postsDir, `${newSlug}.md`);
    if (prevSlug !== newSlug) {
      await fs.writeFile(newPath, file, "utf8");
      try { await fs.unlink(prevPath); } catch {}
    } else {
      await fs.writeFile(newPath, file, "utf8");
    }
    return { slug: newSlug, path: newPath };
  }
}

export async function removePost(slug: string): Promise<boolean> {
  try {
    if (useBlob) {
      await blobDel(`posts/${slug}.md`, { token: blobToken });
      return true;
    } else {
      const filePath = path.join(postsDir, `${slug}.md`);
      await fs.unlink(filePath);
      return true;
    }
  } catch {
    return false;
  }
}

export async function updatePostStatus(slug: string, status: "draft" | "published"): Promise<boolean> {
  try {
    const existing = await getPostBySlug(slug);
    if (!existing) return false;
    const parsed = matter(existing.markdown);
    const data: Record<string, unknown> = { ...(parsed.data as Record<string, unknown>), status };
    if (status === "published" && !(data as { date?: string }).date) {
      (data as { date?: string }).date = new Date().toISOString();
    }
    const file = matter.stringify(parsed.content as string, data as Record<string, unknown>);
    if (useBlob) {
await blobPut(`posts/${slug}.md`, file, { access: "public", contentType: "text/markdown", token: blobToken, allowOverwrite: true });
    } else {
      const filePath = path.join(postsDir, `${slug}.md`);
      await fs.writeFile(filePath, file, "utf8");
    }
    return true;
  } catch {
    return false;
  }
}

