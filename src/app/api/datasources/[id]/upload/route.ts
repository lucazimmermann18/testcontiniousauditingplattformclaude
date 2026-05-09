import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseCsv } from "@/lib/connectors/csv";
import { NextRequest, NextResponse } from "next/server";

function isAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

/** POST /api/datasources/[id]/upload — upload a CSV file and cache as JSON */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const source = await db.dataSource.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string")
    return NextResponse.json({ error: "Keine Datei empfangen" }, { status: 400 });

  const text = await (file as File).text();
  let rows: Record<string, string>[];

  try {
    rows = parseCsv(text);
  } catch {
    return NextResponse.json({ error: "CSV konnte nicht geparst werden" }, { status: 400 });
  }

  if (rows.length === 0)
    return NextResponse.json({ error: "CSV ist leer oder hat keine Datenzeilen" }, { status: 400 });

  await db.dataSource.update({
    where: { id },
    data: {
      lastData: JSON.stringify(rows),
      lastFetchedAt: new Date(),
      lastError: null,
      type: "CSV",
    },
  });

  return NextResponse.json({
    ok: true,
    rowCount: rows.length,
    preview: rows.slice(0, 3),
  });
}
