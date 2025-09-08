import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let slug: string | undefined;
  let paths: string[] | undefined;
  try {
    const body = (await req.json()) as { slug?: string; paths?: string[] };
    slug = body.slug;
    paths = body.paths;
  } catch {
    // ignore bad body
  }

  // Always refresh blog index
  revalidatePath("/blog");

  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
  if (paths && Array.isArray(paths)) {
    for (const p of paths) {
      if (typeof p === "string" && p.startsWith("/")) revalidatePath(p);
    }
  }

  return NextResponse.json({ ok: true });
}
