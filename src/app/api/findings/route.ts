import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { notifyUsers } from "@/lib/notifications";
import { triggerWebhooks } from "@/lib/webhooks";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const findings = await db.finding.findMany({
    include: {
      kpi: {
        include: {
          area: true,
          owner: { select: { id: true, name: true, avatar: true } },
        },
      },
      assignee: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: [{ status: "asc" }, { openedAt: "desc" }],
  });

  const mapped = findings.map((f) => ({
    id: f.id,
    kpi: f.kpiId,
    kpiCode: f.kpi.code,
    title: f.title,
    desc: f.desc,
    severity: f.severity,
    status: f.status,
    owner: f.kpi.owner.name,
    ownerId: f.kpi.owner.id,
    assignee: f.assignee ? { id: f.assignee.id, name: f.assignee.name, avatar: f.assignee.avatar } : null,
    due: f.dueDate.toLocaleDateString("de-DE"),
    opened: f.openedAt.toLocaleDateString("de-DE"),
  }));

  return NextResponse.json(mapped);
}

const PostSchema = z.object({
  kpiId:      z.string(),
  title:      z.string().min(1),
  desc:       z.string().min(1),
  severity:   z.enum(["hoch", "mittel", "niedrig"]),
  dueDate:    z.string(),
  assigneeId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const kpi = await db.kpi.findUnique({ where: { id: parsed.data.kpiId } });
  if (!kpi) return NextResponse.json({ error: "KPI not found" }, { status: 404 });

  const finding = await db.finding.create({
    data: {
      kpiId:      parsed.data.kpiId,
      title:      parsed.data.title,
      desc:       parsed.data.desc,
      severity:   parsed.data.severity as any,
      ownerId:    kpi.ownerId,
      assigneeId: parsed.data.assigneeId ?? null,
      dueDate:    new Date(parsed.data.dueDate),
    },
  });

  await db.activity.create({
    data: {
      type:    "finding",
      kpiId:   parsed.data.kpiId,
      userId:  session.user.id,
      message: `Finding angelegt: ${parsed.data.title}`,
    },
  });

  // Notify KPI owner + assignee
  const notifyIds = [...new Set([kpi.ownerId, kpi.reviewerId, ...(parsed.data.assigneeId ? [parsed.data.assigneeId] : [])])].filter(
    (id) => id !== session.user!.id
  );
  if (notifyIds.length > 0) {
    await notifyUsers(notifyIds, "finding_created",
      `Neues Finding: ${parsed.data.title} (${parsed.data.severity})`,
      { kpiId: parsed.data.kpiId, findingId: finding.id }
    );
  }

  // Trigger webhooks asynchronously
  triggerWebhooks("finding_created", {
    findingId: finding.id,
    title:     finding.title,
    severity:  finding.severity,
    kpiId:     finding.kpiId,
    kpiCode:   kpi.code,
  }).catch(() => {});

  return NextResponse.json(finding, { status: 201 });
}
