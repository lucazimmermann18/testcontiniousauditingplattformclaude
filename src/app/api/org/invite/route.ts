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

  const invites = await db.orgInvite.findMany({
    where: { organizationId: orgId, accepted: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const callerRole = (session.user as any).role as string;
  if (!isAdmin(callerRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as any).id as string;
  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Not in org" }, { status: 404 });

  const { email, role } = await req.json() as { email: string; role: string };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Check if already a member
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await db.orgMember.findFirst({ where: { organizationId: orgId, userId: existingUser.id } });
    if (alreadyMember) return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  // Revoke any existing pending invite for same email
  await db.orgInvite.deleteMany({ where: { organizationId: orgId, email, accepted: false } });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const invite = await db.orgInvite.create({
    data: { organizationId: orgId, email, role: (role ?? "reviewer") as any, expiresAt },
  });

  // If user already exists, add them to org immediately
  if (existingUser) {
    await db.orgMember.create({
      data: { organizationId: orgId, userId: existingUser.id, role: (role ?? "reviewer") as any },
    });
    await db.orgInvite.update({ where: { id: invite.id }, data: { accepted: true } });
    return NextResponse.json({ ...invite, accepted: true, autoAdded: true }, { status: 201 });
  }

  return NextResponse.json(invite, { status: 201 });
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
  const inviteId = searchParams.get("id");
  if (!inviteId) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.orgInvite.deleteMany({ where: { id: inviteId, organizationId: orgId } });
  return NextResponse.json({ ok: true });
}
