import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import TurndownService from "turndown";
import { saveMarkdownPost } from "@/lib/posts";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, slug, html, status } = await req.json();
  if (!title || !html) {
    return NextResponse.json({ error: "Missing title or html" }, { status: 400 });
  }

  const turndown = new TurndownService({ headingStyle: "atx" });
  // Preserve images/figures/captions as HTML to retain attrs like alt, style, etc.
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

  const saved = await saveMarkdownPost({ title, slug, markdown, status: status || "draft" });
  return NextResponse.json({ ok: true, slug: saved.slug });
}

