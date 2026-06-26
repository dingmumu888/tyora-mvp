import { NextResponse } from "next/server";
import { getMedia, putMedia } from "@/lib/server/data-store";

export async function GET() {
  return NextResponse.json(await getMedia());
}

export async function PUT(request: Request) {
  return NextResponse.json(await putMedia(await request.json()));
}
