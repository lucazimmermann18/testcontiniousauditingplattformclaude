import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const PostSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/),
  areaId: z.string().min(1),
  title: z.string().min(3).max(120),
  desc: z.string().max(500).optional().default(""),
  risk: z.number().int().min(1).max(5),
  agent: z.string().min(3).max(80),
  ownerId: z.string().min(1),
  reviewerId: z.string().min(1),
});

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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role as string;
  if (role !== "admin" && role !== "head_of_audit") {
    return NextResponse.json({ error: "Nur Admins können KPIs erstellen" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;

  const area = await db.area.findUnique({ where: { id: d.areaId } });
  if (!area) return NextResponse.json({ error: "Bereich nicht gefunden" }, { status: 404 });

  const existing = await db.kpi.findUnique({ where: { code: d.code } });
  if (existing) return NextResponse.json({ error: "KPI-Code bereits vergeben" }, { status: 409 });

  const kpi = await db.kpi.create({
    data: {
      code: d.code,
      areaId: d.areaId,
      title: d.title,
      desc: d.desc,
      risk: d.risk,
      agent: d.agent,
      ownerId: d.ownerId,
      reviewerId: d.reviewerId,
    },
    include: {
      area: true,
      owner: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });

  await db.activity.create({
    data: {
      type: "agent",
      kpiId: kpi.id,
      userId: session.user!.id,
      message: `KPI ${kpi.code} angelegt: ${kpi.title}`,
    },
  });

  return NextResponse.json({ id: kpi.id, code: kpi.code }, { status: 201 });
}
