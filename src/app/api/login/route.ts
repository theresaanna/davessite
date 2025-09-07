import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return NextResponse.json(
      { error: "Server is missing ADMIN_USERNAME or ADMIN_PASSWORD env vars" },
      { status: 500 }
    );
  }

  if (username === expectedUser && password === expectedPass) {
    const session = await getSession();
    session.user = { username };
    await session.save();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

