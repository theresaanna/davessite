import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { removePost, updateMarkdownPost, updatePostStatus } from "@/lib/posts";
import TurndownService from "turndown";

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await removePost(params.slug);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, html, slug, status } = await req.json();
  if (!title || !html) {
    return NextResponse.json({ error: "Missing title or html" }, { status: 400 });
  }
  const turndown = new TurndownService({ headingStyle: "atx" });
  turndown.addRule('keepImagesAndCaptions', {
    filter: (node: unknown) => {
      const el = node as { nodeName?: string; classList?: { contains?: (cls: string) => boolean } };
      return (
        (el.nodeName === 'IMG') ||
        (el.nodeName === 'FIGURE') ||
        (el.nodeName === 'FIGCAPTION') ||
        (el.nodeName === 'P' && el.classList?.contains?.('image-caption') === true)
      );
    },
    replacement: (_content: string, node: unknown) => (node as { outerHTML?: string }).outerHTML || ''
  });
  const markdown = turndown.turndown(html as string);
  const saved = await updateMarkdownPost({ prevSlug: params.slug, title, slug, markdown, status });
  return NextResponse.json({ ok: true, slug: saved.slug });
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { status } = await req.json();
  if (status !== "draft" && status !== "published") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const ok = await updatePostStatus(params.slug, status);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

