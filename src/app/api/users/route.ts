import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await db.user.findMany({
    where: { active: true },
    select: { id: true, name: true, avatar: true, role: true, email: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}
