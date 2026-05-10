import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { notifyUsers } from "@/lib/notifications";

const PatchSchema = z.object({
  status:     z.enum(["offen", "in_bearbeitung", "geschlossen"]).optional(),
  desc:       z.string().min(1).optional(),
  dueDate:    z.string().optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const prev = await db.finding.findUnique({ where: { id } });

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "geschlossen") updateData.closedAt = new Date();
  }
  if (parsed.data.desc       !== undefined) updateData.desc       = parsed.data.desc;
  if (parsed.data.dueDate    !== undefined) updateData.dueDate    = new Date(parsed.data.dueDate);
  if (parsed.data.assigneeId !== undefined) updateData.assigneeId = parsed.data.assigneeId;

  const finding = await db.finding.update({ where: { id }, data: updateData });

  await db.activity.create({
    data: {
      type:    "status_change",
      kpiId:   finding.kpiId,
      userId:  session.user.id!,
      message: `Finding "${finding.title}" → ${finding.status}`,
    },
  });

  // Notify new assignee if changed
  if (parsed.data.assigneeId && parsed.data.assigneeId !== prev?.assigneeId && parsed.data.assigneeId !== session.user.id) {
    await notifyUsers([parsed.data.assigneeId], "task_assigned",
      `Dir wurde ein Finding zugewiesen: ${finding.title}`,
      { kpiId: finding.kpiId, findingId: finding.id }
    );
  }

  return NextResponse.json({ id: finding.id, status: finding.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.finding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
