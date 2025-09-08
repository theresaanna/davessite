import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAllPostsMeta } from "@/lib/posts";

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const metas = await getAllPostsMeta({ includeDrafts: true });
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  return NextResponse.json({ ok: true, hasBlob, count: metas.length, posts: metas });
}
