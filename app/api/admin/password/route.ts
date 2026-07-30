import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  requireAdminSession
} from "@/lib/server/admin-auth";
import {
  updateAdminPassword,
  verifyAdminPassword
} from "@/lib/server/admin-credential-store";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const currentPassword =
    body && typeof body === "object" && "currentPassword" in body
      ? String((body as { currentPassword?: unknown }).currentPassword || "")
      : "";
  const newPassword =
    body && typeof body === "object" && "newPassword" in body
      ? String((body as { newPassword?: unknown }).newPassword || "")
      : "";

  if (
    newPassword.length < MIN_PASSWORD_LENGTH ||
    newPassword.length > MAX_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      {
        success: false,
        message: `New password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`
      },
      { status: 400 }
    );
  }

  try {
    const current = await verifyAdminPassword(currentPassword);
    if (!current.configured) {
      return NextResponse.json(
        { success: false, message: "Authentication unavailable." },
        { status: 500 }
      );
    }
    if (!current.valid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 400 }
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: "Choose a password different from the current password." },
        { status: 400 }
      );
    }

    await updateAdminPassword(newPassword);
    return clearAdminSessionCookie(
      NextResponse.json({ success: true, message: "Password changed. Sign in again." })
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to change password. Please try again." },
      { status: 500 }
    );
  }
}
