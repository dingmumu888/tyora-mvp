import { hasAdminSession } from "@/lib/server/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ authenticated: await hasAdminSession() });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
