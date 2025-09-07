import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

  const safeBase = (file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const stamp = Date.now();
  const key = `uploads/${stamp}-${safeBase}`;

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_S3_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "Missing AWS S3 env vars" }, { status: 500 });
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ACL: "public-read",
  }));

  const publicBase = process.env.AWS_S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
  const url = `${publicBase}/${key}`;
  return NextResponse.json({ ok: true, url });
}

