import path from "node:path";
import fs from "node:fs/promises";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export type PostMeta = {
  title: string;
  slug: string;
  date?: string;
};

const postsDir = path.join(process.cwd(), "content", "posts");

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function ensurePostsDir() {
  await fs.mkdir(postsDir, { recursive: true });
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  await ensurePostsDir();
  const files = await fs.readdir(postsDir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));
  const metas: PostMeta[] = [];
  for (const file of mdFiles) {
    const full = path.join(postsDir, file);
    const raw = await fs.readFile(full, "utf8");
    const { data } = matter(raw);
    const slug = file.replace(/\.md$/, "");
    metas.push({
      title: (data.title as string) || slug,
      slug,
      date: data.date as string | undefined,
    });
  }
  metas.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return metas;
}

export async function getPostBySlug(slug: string): Promise<{ meta: PostMeta; html: string } | null> {
  const filePath = path.join(postsDir, `${slug}.md`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(raw);
    const processed = await remark().use(html).process(content);
    const contentHtml = processed.toString();
    const meta: PostMeta = {
      title: (data.title as string) || slug,
      slug,
      date: data.date as string | undefined,
    };
    return { meta, html: contentHtml };
  } catch {
    return null;
  }
}

export async function saveMarkdownPost({
  title,
  slug,
  markdown,
}: {
  title: string;
  slug?: string;
  markdown: string;
}): Promise<{ slug: string; path: string }> {
  await ensurePostsDir();
  const finalSlug = slug && slug.length > 0 ? slugify(slug) : slugify(title);
  const filePath = path.join(postsDir, `${finalSlug}.md`);
  const now = new Date().toISOString();
  const file = matter.stringify(markdown, { title, date: now, slug: finalSlug });
  await fs.writeFile(filePath, file, "utf8");
  return { slug: finalSlug, path: filePath };
}

export async function removePost(slug: string): Promise<boolean> {
  const filePath = path.join(postsDir, `${slug}.md`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

