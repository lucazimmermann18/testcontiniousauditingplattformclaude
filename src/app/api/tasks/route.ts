import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kpiId = searchParams.get("kpiId");
  const mine = searchParams.get("mine") === "true";

  const tasks = await db.task.findMany({
    where: {
      ...(kpiId ? { kpiId } : {}),
      ...(mine ? { assigneeId: session.user.id } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

const PostSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  kpiId: z.string().optional(),
  findingId: z.string().optional(),
  assigneeId: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dueDate: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await db.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      createdById: session.user.id!,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true, avatar: true } },
    },
  });

  await db.notification.create({
    data: {
      userId: parsed.data.assigneeId,
      type: "task_assigned",
      message: `Neue Aufgabe zugewiesen: ${parsed.data.title}`,
      metadata: JSON.stringify({ taskId: task.id, kpiId: parsed.data.kpiId }),
    },
  });

  if (parsed.data.kpiId) {
    await db.activity.create({
      data: {
        type: "comment",
        kpiId: parsed.data.kpiId,
        userId: session.user.id,
        message: `Aufgabe erstellt: ${parsed.data.title}`,
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
