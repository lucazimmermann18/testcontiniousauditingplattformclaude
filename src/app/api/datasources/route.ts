import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

function isAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

const CreateSchema = z.object({
  kpiId:        z.string().min(1),
  name:         z.string().min(1).max(80),
  type:         z.enum(["REST", "CSV", "MANUAL"]).default("MANUAL"),
  url:          z.string().url().optional(),
  method:       z.enum(["GET", "POST"]).default("GET"),
  headers:      z.record(z.string(), z.string()).optional(),
  bodyTemplate: z.string().optional(),
  jsonPath:     z.string().optional(),
  active:       z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await db.dataSource.findMany({
    include: { kpi: { select: { id: true, code: true, title: true, areaId: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    sources.map((s) => ({
      ...s,
      headersEnc: undefined,
      hasHeaders: !!s.headersEnc,
      lastData: s.lastData ? true : false,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { kpiId, name, type, url, method, headers, bodyTemplate, jsonPath, active } = parsed.data;

  const headersEnc = headers && Object.keys(headers).length > 0
    ? encrypt(JSON.stringify(headers))
    : null;

  const source = await db.dataSource.upsert({
    where: { kpiId },
    create: { kpiId, name, type, url, method, headersEnc, bodyTemplate, jsonPath, active },
    update: { name, type, url, method, headersEnc, bodyTemplate, jsonPath, active },
  });

  return NextResponse.json({ ...source, headersEnc: undefined, hasHeaders: !!source.headersEnc });
}
