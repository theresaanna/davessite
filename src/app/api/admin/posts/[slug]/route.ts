import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { removePost, updateMarkdownPost } from "@/lib/posts";
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
  const { title, html, slug } = await req.json();
  if (!title || !html) {
    return NextResponse.json({ error: "Missing title or html" }, { status: 400 });
  }
  const turndown = new TurndownService({ headingStyle: "atx" });
  const markdown = turndown.turndown(html as string);
  const saved = await updateMarkdownPost({ prevSlug: params.slug, title, slug, markdown });
  return NextResponse.json({ ok: true, slug: saved.slug });
}

