import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import path from "node:path";
import fs from "node:fs/promises";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]; 
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeBase = (file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const stamp = Date.now();
  const filename = `${stamp}-${safeBase}`;
  const outPath = path.join(uploadsDir, filename);

  await fs.writeFile(outPath, buffer);

  const url = `/uploads/${filename}`;
  return NextResponse.json({ ok: true, url });
}

