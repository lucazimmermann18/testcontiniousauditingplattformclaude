import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

function isAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

const PatchSchema = z.object({
  name:         z.string().min(1).max(80).optional(),
  type:         z.enum(["REST", "CSV", "MANUAL"]).optional(),
  url:          z.string().url().optional().nullable(),
  method:       z.enum(["GET", "POST"]).optional(),
  headers:      z.record(z.string(), z.string()).optional().nullable(),
  bodyTemplate: z.string().optional().nullable(),
  jsonPath:     z.string().optional().nullable(),
  active:       z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const source = await db.dataSource.findUnique({ where: { id }, include: { kpi: { select: { code: true, title: true } } } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...source, headersEnc: undefined, hasHeaders: !!source.headersEnc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { headers, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };

  if (headers !== undefined) {
    updateData.headersEnc = headers && Object.keys(headers).length > 0
      ? encrypt(JSON.stringify(headers))
      : null;
  }

  const source = await db.dataSource.update({ where: { id }, data: updateData });
  return NextResponse.json({ ...source, headersEnc: undefined, hasHeaders: !!source.headersEnc });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db.dataSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
