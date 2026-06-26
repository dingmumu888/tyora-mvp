import { NextResponse } from "next/server";
import { getContent, putContent, resetStoredContent } from "@/lib/server/data-store";

export async function GET() {
  return NextResponse.json(await getContent());
}

export async function PUT(request: Request) {
  return NextResponse.json(await putContent(await request.json()));
}

export async function DELETE() {
  return NextResponse.json(await resetStoredContent());
}
