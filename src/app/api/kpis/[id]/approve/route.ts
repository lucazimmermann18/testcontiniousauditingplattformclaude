import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { CURRENT_QUARTER } from "@/data/audit-data";

type Params = { params: Promise<{ id: string }> };

const PostSchema = z.object({
  action: z.enum(["reviewer_approve", "head_approve", "reject"]),
  note: z.string().max(500).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const approval = await db.kpiApproval.findUnique({ where: { kpiId: id } });
  return NextResponse.json(approval);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const role = (session.user as any).role as string;
  const { action, note } = parsed.data;

  const kpi = await db.kpi.findUnique({
    where: { id },
    select: { code: true, title: true, ownerId: true, reviewerId: true },
  });
  if (!kpi) return NextResponse.json({ error: "KPI not found" }, { status: 404 });

  let updateData: Record<string, unknown> = {};
  let activityMsg = "";
  let notifyUserId: string | null = null;

  if (action === "reviewer_approve") {
    if (role !== "reviewer" && role !== "head_of_audit" && role !== "admin")
      return NextResponse.json({ error: "Nur Reviewer können diesen Schritt ausführen" }, { status: 403 });
    updateData = {
      status: "reviewer_approved",
      reviewerId: session.user.id,
      reviewerNote: note,
      reviewedAt: new Date(),
    };
    activityMsg = `Reviewer-Freigabe erteilt für ${kpi.code}`;
    notifyUserId = kpi.ownerId;
  } else if (action === "head_approve") {
    if (role !== "head_of_audit" && role !== "admin")
      return NextResponse.json({ error: "Nur Head of Audit kann endgültig freigeben" }, { status: 403 });
    updateData = {
      status: "head_approved",
      headAuditorId: session.user.id,
      headAuditorNote: note,
      headApprovedAt: new Date(),
    };
    activityMsg = `Endgültig freigegeben (Head of Audit) für ${kpi.code}`;
    notifyUserId = kpi.reviewerId;
  } else if (action === "reject") {
    updateData = {
      status: "rejected",
      headAuditorId: session.user.id,
      headAuditorNote: note,
      headApprovedAt: new Date(),
    };
    activityMsg = `Freigabe abgelehnt für ${kpi.code}`;
    notifyUserId = kpi.ownerId;
  }

  const approval = await db.kpiApproval.upsert({
    where: { kpiId: id },
    create: { kpiId: id, period: CURRENT_QUARTER, ...updateData },
    update: updateData,
  });

  await db.activity.create({
    data: { type: "approved", kpiId: id, userId: session.user.id, message: activityMsg },
  });

  if (notifyUserId) {
    await db.notification.create({
      data: {
        userId: notifyUserId,
        type: action === "reject" ? "approval_requested" : "approval_done",
        message: activityMsg,
        metadata: JSON.stringify({ kpiId: id }),
      },
    });
  }

  return NextResponse.json(approval);
}
