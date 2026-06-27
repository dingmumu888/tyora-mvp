import { clearAdminSessionCookie } from "@/lib/server/admin-auth";
import { NextResponse } from "next/server";

export async function POST() {
  return clearAdminSessionCookie(NextResponse.json({ ok: true }));
}
