import { NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/server/admin-auth";
import { verifyAdminPassword } from "@/lib/server/admin-credential-store";

export async function POST(request: Request) {
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

  try {
    const result = await verifyAdminPassword(password);
    if (!result.configured) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          { error: "ADMIN_PASSWORD environment variable is missing." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "Authentication unavailable." }, { status: 500 });
    }
    if (result.valid) {
      return setAdminSessionCookie(NextResponse.json({ ok: true }), result.version);
    }
  } catch {
    return NextResponse.json({ error: "Authentication unavailable." }, { status: 500 });
  }

  return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
}
