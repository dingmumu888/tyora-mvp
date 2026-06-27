import { NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/server/admin-auth";

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD environment variable is missing." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Authentication unavailable." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const password =
    body && typeof body === "object" && "password" in body
      ? String((body as { password?: unknown }).password || "")
      : "";

  if (password === adminPassword) {
    try {
      return setAdminSessionCookie(NextResponse.json({ ok: true }));
    } catch {
      return NextResponse.json({ error: "Authentication unavailable." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
}
