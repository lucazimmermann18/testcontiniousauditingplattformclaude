import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kpis = await db.kpi.findMany({
    include: {
      area: true,
      owner: { select: { id: true, name: true, avatar: true } },
      reviewer: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: [{ area: { id: "asc" } }, { code: "asc" }],
  });

  const mapped = kpis.map((k) => ({
    id: k.id,
    code: k.code,
    area: k.area.id,
    areaName: k.area.name,
    areaShort: k.area.short,
    areaColor: k.area.color,
    title: k.title,
    desc: k.desc,
    risk: k.risk,
    status: k.status,
    confidence: k.confidence,
    value: k.value,
    delta: k.delta,
    lastRun: k.lastRun,
    agent: k.agent,
    trend: JSON.parse(k.trend || "[]"),
    owner: k.owner.name,
    ownerId: k.owner.id,
    reviewer: k.reviewer.name,
    reviewerId: k.reviewer.id,
  }));

  return NextResponse.json(mapped);
}
