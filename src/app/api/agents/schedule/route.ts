import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedules = await db.agentSchedule.findMany({
    include: { kpi: { select: { code: true, title: true, agent: true } } },
  });
  return NextResponse.json(schedules);
}

const PatchSchema = z.object({
  kpiId: z.string(),
  enabled: z.boolean(),
  intervalHours: z.number().int().min(1).max(720).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { kpiId, enabled, intervalHours } = parsed.data;
  const nextRunAt = enabled ? new Date(Date.now() + (intervalHours ?? 24) * 3600000) : null;

  const schedule = await db.agentSchedule.upsert({
    where: { kpiId },
    create: { kpiId, enabled, intervalHours: intervalHours ?? 24, nextRunAt },
    update: { enabled, ...(intervalHours ? { intervalHours } : {}), nextRunAt },
  });

  return NextResponse.json(schedule);
}
