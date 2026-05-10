import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kpiId = searchParams.get("kpiId");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  const runs = await db.auditRun.findMany({
    where: {
      ...(kpiId ? { kpiId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      kpi: { select: { id: true, code: true, title: true, agent: true } },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return NextResponse.json(runs);
}
