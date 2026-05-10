import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const areas = await db.area.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(areas);
}
