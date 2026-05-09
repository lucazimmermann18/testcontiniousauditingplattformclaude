import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function requireAdmin(role: string | undefined) {
  return role === "admin" || role === "head_of_audit";
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as any).role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as any).role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { setActive } = await req.json();

  if (setActive) {
    await db.apiKey.updateMany({ data: { isActive: false } });
    await db.apiKey.update({ where: { id }, data: { isActive: true } });
  }

  const updated = await db.apiKey.findUnique({ where: { id } });
  return NextResponse.json({ id: updated?.id, isActive: updated?.isActive });
}
