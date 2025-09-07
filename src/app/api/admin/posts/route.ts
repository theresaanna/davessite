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
    filter: (node) => {
      return (
        (node.nodeName === 'IMG') ||
        (node.nodeName === 'FIGURE') ||
        (node.nodeName === 'FIGCAPTION') ||
        (node.nodeName === 'P' && (node as HTMLElement).classList?.contains('image-caption'))
      );
    },
    replacement: (_content, node) => (node as HTMLElement).outerHTML || ''
  });
  const markdown = turndown.turndown(html as string);

  const saved = await saveMarkdownPost({ title, slug, markdown, status: status || "draft" });
  return NextResponse.json({ ok: true, slug: saved.slug });
}

