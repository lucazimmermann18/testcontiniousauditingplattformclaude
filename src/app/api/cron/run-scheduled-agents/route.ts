import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { streamAgent, getDueScheduledKpis } from "@/lib/agents/runner";

const MAX_AGENTS_PER_RUN = 10;

// Vercel Cron & external callers authenticate with X-Cron-Secret header.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const startedAt = Date.now();
  const dueKpiIds = await getDueScheduledKpis();

  if (dueKpiIds.length === 0) {
    return NextResponse.json({ ok: true, ran: 0, message: "Keine fälligen Agenten." });
  }

  const batch = dueKpiIds.slice(0, MAX_AGENTS_PER_RUN);
  const results: { kpiId: string; status: "ok" | "error" | "dry"; durationMs: number }[] = [];

  for (const kpiId of batch) {
    if (dryRun) {
      results.push({ kpiId, status: "dry", durationMs: 0 });
      continue;
    }

    const t0 = Date.now();
    let finalStatus: "ok" | "error" = "ok";

    // Advance nextRunAt immediately to prevent duplicate runs if job is slow
    const schedule = await db.agentSchedule.findUnique({ where: { kpiId } });
    if (schedule) {
      await db.agentSchedule.update({
        where: { kpiId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: new Date(Date.now() + schedule.intervalHours * 3600000),
        },
      });
    }

    try {
      // Consume the stream to completion — runner handles all DB writes
      for await (const chunk of streamAgent(kpiId)) {
        if (chunk.type === "done" || chunk.type === "error") {
          if (chunk.type === "error") finalStatus = "error";
          break;
        }
      }
    } catch {
      finalStatus = "error";
    }

    results.push({ kpiId, status: finalStatus, durationMs: Date.now() - t0 });
  }

  return NextResponse.json({
    ok: true,
    ran: results.filter((r) => r.status !== "dry").length,
    skipped: dueKpiIds.length - batch.length,
    totalDueKpis: dueKpiIds.length,
    durationMs: Date.now() - startedAt,
    results,
  });
}

// Vercel Cron triggers GET by default
export async function GET(req: Request) {
  return POST(req);
}
