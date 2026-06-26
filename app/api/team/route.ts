import { NextResponse } from "next/server";
import { getTeamMembers, putTeamMembers } from "@/lib/server/data-store";

export async function GET() {
  return NextResponse.json(await getTeamMembers());
}

export async function PUT(request: Request) {
  return NextResponse.json(await putTeamMembers(await request.json()));
}
