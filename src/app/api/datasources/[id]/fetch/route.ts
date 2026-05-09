import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fetchDataSource } from "@/lib/connectors/fetcher";
import { NextRequest, NextResponse } from "next/server";

function isAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

/** POST /api/datasources/[id]/fetch — trigger a live fetch and cache the result */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const source = await db.dataSource.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (source.type !== "REST" || !source.url) {
    return NextResponse.json({ error: "Nur REST-Datenquellen können abgerufen werden" }, { status: 400 });
  }

  const result = await fetchDataSource({
    url: source.url,
    method: source.method,
    headersEnc: source.headersEnc,
    bodyTemplate: source.bodyTemplate,
    jsonPath: source.jsonPath,
  });

  if (!result.ok) {
    await db.dataSource.update({
      where: { id },
      data: { lastError: result.error, lastFetchedAt: new Date() },
    });
    return NextResponse.json({ ok: false, error: result.error, statusCode: result.statusCode }, { status: 502 });
  }

  const dataStr = JSON.stringify(result.data);
  await db.dataSource.update({
    where: { id },
    data: {
      lastData: dataStr,
      lastFetchedAt: new Date(),
      lastError: null,
    },
  });

  const preview = Array.isArray(result.data)
    ? (result.data as unknown[]).slice(0, 3)
    : result.data;

  return NextResponse.json({
    ok: true,
    statusCode: result.statusCode,
    rowCount: Array.isArray(result.data) ? (result.data as unknown[]).length : null,
    preview,
  });
}
