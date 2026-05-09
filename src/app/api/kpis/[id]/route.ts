import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const PatchSchema = z.object({
  status: z.enum(["ok", "review", "finding", "running", "pending"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
  value: z.string().optional(),
  delta: z.string().optional(),
  lastRun: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const kpi = await db.kpi.update({
    where: { id },
    data: parsed.data,
  });

  // Log activity
  const activityTypeMap: Record<string, string> = {
    ok: "approved",
    review: "status_change",
    finding: "finding",
    running: "rerun",
    pending: "status_change",
  };

  if (parsed.data.status) {
    await db.activity.create({
      data: {
        type: activityTypeMap[parsed.data.status] as any,
        kpiId: id,
        userId: session.user.id,
        message: `Status auf "${parsed.data.status}" gesetzt`,
      },
    });
  }

  return NextResponse.json({ id: kpi.id, status: kpi.status });
}
