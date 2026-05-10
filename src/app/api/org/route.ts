import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function isAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  // Find the org this user belongs to
  const membership = await db.orgMember.findFirst({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: { select: { members: true, invites: { where: { accepted: false } } } },
        },
      },
    },
  });

  if (!membership) return NextResponse.json(null);
  return NextResponse.json(membership.organization);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as any).id as string;

  // Check if user already has an org
  const existing = await db.orgMember.findFirst({ where: { userId } });
  if (existing) return NextResponse.json({ error: "Already in an org" }, { status: 409 });

  const body = await req.json();
  const { name, slug } = body as { name: string; slug: string };
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  // Slugify
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const existing2 = await db.organization.findUnique({ where: { slug: safeSlug } });
  if (existing2) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });

  const org = await db.organization.create({
    data: {
      name,
      slug: safeSlug,
      members: { create: { userId, role: "admin" } },
    },
  });

  return NextResponse.json(org, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as any).id as string;
  const membership = await db.orgMember.findFirst({ where: { userId } });
  if (!membership) return NextResponse.json({ error: "Not in org" }, { status: 404 });

  const body = await req.json();
  const { name, logoUrl, allowedDomains } = body as { name?: string; logoUrl?: string; allowedDomains?: string };

  const org = await db.organization.update({
    where: { id: membership.organizationId },
    data: {
      ...(name && { name }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(allowedDomains !== undefined && { allowedDomains }),
    },
  });

  return NextResponse.json(org);
}
