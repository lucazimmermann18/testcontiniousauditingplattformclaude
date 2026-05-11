import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const approvals = await db.kpiApproval.findMany({
      include: {
        kpi: {
          include: {
            area: { select: { name: true } },
            owner: { select: { id: true, name: true, avatar: true } },
            reviewer: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Enrich with reviewer/headAuditor user info
    const userIds = [
      ...approvals.map((a) => a.reviewerId),
      ...approvals.map((a) => a.headAuditorId),
    ].filter(Boolean) as string[];

    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: [...new Set(userIds)] } },
          select: { id: true, name: true, avatar: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const result = approvals.map((a) => ({
      ...a,
      reviewerUser: a.reviewerId ? userMap[a.reviewerId] ?? null : null,
      headAuditorUser: a.headAuditorId ? userMap[a.headAuditorId] ?? null : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/approvals]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
