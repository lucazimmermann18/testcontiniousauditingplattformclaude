import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const quarter = searchParams.get("quarter");
    if (!quarter) return NextResponse.json({ error: "quarter required" }, { status: 400 });

    const entries = await db.auditPlanEntry.findMany({
      where: { quarter },
      include: {
        kpi: {
          include: {
            area: { select: { name: true } },
            owner: { select: { name: true } },
            reviewer: { select: { name: true } },
          },
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(entries);
  } catch (err) {
    console.error("[GET /api/audit-plan]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

// Bulk upsert — replaces entire plan for a quarter
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== "admin" && role !== "head_of_audit") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { quarter, entries } = await req.json();
    if (!quarter || !Array.isArray(entries)) {
      return NextResponse.json({ error: "quarter and entries required" }, { status: 400 });
    }

    await db.$transaction(
      entries.map((e: any) =>
        db.auditPlanEntry.upsert({
          where: { quarter_kpiId: { quarter, kpiId: e.kpiId } },
          create: {
            quarter,
            kpiId: e.kpiId,
            assignee: e.assignee ?? "",
            priority: e.priority ?? "medium",
            plannedDate: e.plannedDate ?? "",
            notes: e.notes ?? "",
            done: e.done ?? false,
          },
          update: {
            assignee: e.assignee ?? "",
            priority: e.priority ?? "medium",
            plannedDate: e.plannedDate ?? "",
            notes: e.notes ?? "",
            done: e.done ?? false,
          },
        })
      )
    );

    return NextResponse.json({ ok: true, count: entries.length });
  } catch (err) {
    console.error("[POST /api/audit-plan]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

// Single entry patch
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quarter, kpiId, ...patch } = await req.json();
    if (!quarter || !kpiId) return NextResponse.json({ error: "quarter and kpiId required" }, { status: 400 });

    const updated = await db.auditPlanEntry.upsert({
      where: { quarter_kpiId: { quarter, kpiId } },
      create: { quarter, kpiId, ...patch },
      update: patch,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/audit-plan]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
