import { NextResponse } from "next/server";
import { createLead, getLeads, putLeads } from "@/lib/server/data-store";

export async function GET() {
  return NextResponse.json(await getLeads());
}

export async function POST(request: Request) {
  return NextResponse.json(await createLead(await request.json()), { status: 201 });
}

export async function PUT(request: Request) {
  return NextResponse.json(await putLeads(await request.json()));
}
