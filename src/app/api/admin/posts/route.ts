import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import TurndownService from "turndown";
import { saveMarkdownPost } from "@/lib/posts";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, slug, html } = await req.json();
  if (!title || !html) {
    return NextResponse.json({ error: "Missing title or html" }, { status: 400 });
  }

  const turndown = new TurndownService({ headingStyle: "atx" });
  const markdown = turndown.turndown(html as string);

  const saved = await saveMarkdownPost({ title, slug, markdown });
  return NextResponse.json({ ok: true, slug: saved.slug });
}

