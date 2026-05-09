import { db } from "@/lib/db";
import { callAgentOnce, streamAgentResponse } from "./provider";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { MOCK_DATA } from "./mock-data";
import type { AgentResult, AgentContext } from "./types";

function parseAgentResult(raw: string): AgentResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Kein gültiges JSON in der Agent-Antwort gefunden");
  return JSON.parse(jsonMatch[0]) as AgentResult;
}

async function buildContext(kpiId: string): Promise<AgentContext> {
  const kpi = await db.kpi.findUnique({
    where: { id: kpiId },
    include: {
      area: true,
      mockData: true,
    },
  });
  if (!kpi) throw new Error(`KPI ${kpiId} nicht gefunden`);

  const mockEntry = kpi.mockData
    ? { description: kpi.mockData.description, data: JSON.parse(kpi.mockData.data) }
    : MOCK_DATA[kpi.code] ?? { description: "Keine Mock-Daten verfügbar", data: {} };

  return {
    kpiCode: kpi.code,
    kpiTitle: kpi.title,
    kpiDesc: kpi.desc,
    agentName: kpi.agent,
    area: kpi.area.name,
    currentValue: kpi.value,
    delta: kpi.delta,
    trend: JSON.parse(kpi.trend || "[]"),
    mockDataDescription: mockEntry.description,
    mockData: mockEntry.data,
  };
}

export async function runAgent(kpiId: string): Promise<AgentResult> {
  const ctx = await buildContext(kpiId);
  const startedAt = new Date();

  await db.auditRun.create({
    data: { kpiId, agent: ctx.agentName, status: "running" },
  });

  try {
    const raw = await callAgentOnce(SYSTEM_PROMPT, buildUserPrompt(ctx));
    const result = parseAgentResult(raw);
    const durationMs = Date.now() - startedAt.getTime();

    await db.auditRun.updateMany({
      where: { kpiId, status: "running" },
      data: {
        status: result.status as any,
        confidence: result.confidence,
        summary: result.summary,
        rawOutput: raw,
        finishedAt: new Date(),
        durationMs,
      },
    });

    const lastRun = `vor wenigen Sek.`;
    await db.kpi.update({
      where: { id: kpiId },
      data: {
        status: result.status as any,
        confidence: result.confidence,
        lastRun,
      },
    });

    await db.activity.create({
      data: {
        type: result.status === "finding" ? "finding" : result.status === "ok" ? "approved" : "agent",
        kpiId,
        message: `${ctx.agentName}: ${result.summary}`,
      },
    });

    if (result.status === "finding" && result.anomalies.length > 0) {
      await db.finding.create({
        data: {
          kpiId,
          title: result.anomalies[0].title,
          desc: result.summary,
          severity: result.anomalies[0].severity as any,
          ownerId: (await db.kpi.findUnique({ where: { id: kpiId }, select: { ownerId: true } }))!.ownerId,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await db.agentSchedule.upsert({
      where: { kpiId },
      create: { kpiId, lastRunAt: new Date(), nextRunAt: null },
      update: { lastRunAt: new Date() },
    });

    return result;
  } catch (err) {
    await db.auditRun.updateMany({
      where: { kpiId, status: "running" },
      data: { status: "error", finishedAt: new Date() },
    });
    throw err;
  }
}

export async function* streamAgent(
  kpiId: string
): AsyncGenerator<{ type: string; content?: string; result?: AgentResult; error?: string }> {
  const ctx = await buildContext(kpiId);
  const startedAt = new Date();
  let raw = "";

  const auditRun = await db.auditRun.create({
    data: { kpiId, agent: ctx.agentName, status: "running" },
  });

  try {
    for await (const chunk of streamAgentResponse(SYSTEM_PROMPT, buildUserPrompt(ctx))) {
      if (chunk.type === "text") {
        raw += chunk.content;
        yield { type: "text", content: chunk.content };
      } else if (chunk.type === "error") {
        yield { type: "error", error: chunk.error };
        return;
      }
    }

    const result = parseAgentResult(raw);
    const durationMs = Date.now() - startedAt.getTime();

    await db.auditRun.update({
      where: { id: auditRun.id },
      data: {
        status: result.status as any,
        confidence: result.confidence,
        summary: result.summary,
        rawOutput: raw,
        finishedAt: new Date(),
        durationMs,
      },
    });

    await db.kpi.update({
      where: { id: kpiId },
      data: {
        status: result.status as any,
        confidence: result.confidence,
        lastRun: "vor wenigen Sek.",
      },
    });

    await db.activity.create({
      data: {
        type: result.status === "finding" ? "finding" : result.status === "ok" ? "approved" : "agent",
        kpiId,
        message: `${ctx.agentName}: ${result.summary}`,
      },
    });

    if (result.status === "finding" && result.anomalies.length > 0) {
      const kpiOwner = await db.kpi.findUnique({ where: { id: kpiId }, select: { ownerId: true } });
      await db.finding.create({
        data: {
          kpiId,
          title: result.anomalies[0].title,
          desc: result.summary,
          severity: result.anomalies[0].severity as any,
          ownerId: kpiOwner!.ownerId,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await db.agentSchedule.upsert({
      where: { kpiId },
      create: { kpiId, lastRunAt: new Date(), nextRunAt: null },
      update: { lastRunAt: new Date() },
    });

    yield { type: "done", result };
  } catch (err) {
    await db.auditRun.update({
      where: { id: auditRun.id },
      data: { status: "error", finishedAt: new Date() },
    });
    yield { type: "error", error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getLastAuditRun(kpiId: string) {
  return db.auditRun.findFirst({
    where: { kpiId, status: { not: "running" } },
    orderBy: { finishedAt: "desc" },
  });
}

export async function getDueScheduledKpis(): Promise<string[]> {
  const now = new Date();
  const schedules = await db.agentSchedule.findMany({
    where: {
      enabled: true,
      OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
    },
  });
  return schedules.map((s) => s.kpiId);
}
