import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const source = await db.dataSource.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (source.type !== "MANUAL") {
    return NextResponse.json({ error: "Nur MANUAL-Quellen unterstützen manuellen Dateneintrag" }, { status: 400 });
  }

  const body = await req.json();
  const { data } = body;
  if (!data) return NextResponse.json({ error: "data ist erforderlich" }, { status: 400 });

  // Validate it's serialisable JSON
  let serialised: string;
  try {
    serialised = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    JSON.parse(serialised); // validate
  } catch {
    return NextResponse.json({ error: "data muss gültiges JSON sein" }, { status: 400 });
  }

  const updated = await db.dataSource.update({
    where: { id },
    data: {
      lastData: serialised,
      lastFetchedAt: new Date(),
      lastError: null,
    },
  });

  return NextResponse.json({ ok: true, updatedAt: updated.lastFetchedAt });
}
