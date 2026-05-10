import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function getOrgId(userId: string) {
  const m = await db.orgMember.findFirst({ where: { userId } });
  return m?.organizationId ?? null;
}

function isAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json([]);

  const members = await db.orgMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return NextResponse.json(members);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const callerRole = (session.user as any).role as string;
  if (!isAdmin(callerRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as any).id as string;
  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Not in org" }, { status: 404 });

  const { memberId, role } = await req.json() as { memberId: string; role: string };

  const member = await db.orgMember.findFirst({ where: { id: memberId, organizationId: orgId } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const updated = await db.orgMember.update({
    where: { id: memberId },
    data: { role: role as any },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const callerRole = (session.user as any).role as string;
  if (!isAdmin(callerRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as any).id as string;
  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Not in org" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const member = await db.orgMember.findFirst({ where: { id: memberId, organizationId: orgId } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Don't allow removing yourself if you're the only admin
  if (member.userId === userId) {
    const adminCount = await db.orgMember.count({ where: { organizationId: orgId, role: { in: ["admin", "head_of_audit"] } } });
    if (adminCount <= 1) return NextResponse.json({ error: "Cannot remove last admin" }, { status: 400 });
  }

  await db.orgMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
