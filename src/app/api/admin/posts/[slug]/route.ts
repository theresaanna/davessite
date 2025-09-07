import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { removePost } from "@/lib/posts";

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

